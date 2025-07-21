import { Request, Response } from 'express';
import { prismaClient } from '../../lib/prisma.js';
import { AccessStatus } from '@prisma/client';

export const createAnimalType = async (req: Request, res: Response) => {
    try {
        const { userId, labId } = req.params;
        const { name, description, customFields = [] } = req.body;

        // Check required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: name'
            });
        }

        // Check if user has access to this laboratory (labId is laboratory name)
        const userLaboratory = await prismaClient.userLaboratory.findFirst({
            where: {
                userId: userId,
                accessStatus: AccessStatus.ACTIVE,
                laboratory: {
                    name: labId // labId это имя лаборатории
                }
            },
            include: {
                laboratory: true
            }
        });

        if (!userLaboratory) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this laboratory'
            });
        }

        const laboratoryId = userLaboratory.laboratory.id;

        // Check if animal type with this name already exists in this laboratory
        const existingType = await prismaClient.animalType.findFirst({
            where: {
                name: name,
                laboratoryId: laboratoryId
            }
        });

        if (existingType) {
            return res.status(409).json({
                success: false,
                message: 'Animal type with this name already exists in this laboratory'
            });
        }

        // Create animal type
        const animalType = await prismaClient.animalType.create({
            data: {
                name,
                description: description || null,
                laboratoryId
            },
            include: {
                laboratory: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        // Create custom fields for this animal type
        if (customFields && Array.isArray(customFields)) {
            const customFieldPromises = customFields.map(field => 
                prismaClient.customField.create({
                    data: {
                        name: field.name,
                        fieldType: field.fieldType,
                        isRequired: field.isRequired || false,
                        defaultValue: field.defaultValue || null,
                        description: field.description || null,
                        animalTypeId: animalType.id
                    }
                })
            );
            
            const createdCustomFields = await Promise.all(customFieldPromises);
            
            // Return animal type with created custom fields
            const animalTypeWithFields = {
                ...animalType,
                customFields: createdCustomFields
            };

            return res.status(201).json({
                success: true,
                data: animalTypeWithFields,
                message: 'Animal type created successfully'
            });
        }

        res.status(201).json({
            success: true,
            data: animalType,
            message: 'Animal type created successfully'
        });
    } catch (error) {
        console.error('Error creating animal type:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create animal type',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}; 