import { Sex, AnimalStatus, AnimalType, FieldType, AccessStatus } from '@prisma/client';
import prismaClient from '../../lib/prisma.js';
import { Request, Response } from 'express';

interface CustomFieldInput {
    name: string;
    fieldType: FieldType;
    isRequired?: boolean;
    defaultValue?: string;
    description?: string;
}

const animalClient = prismaClient.animal;

export const addAnimal = async (req: Request, res: Response) => {
    try {
        const { 
            acquisitionDate,
            newAnimalType,
            animalTypeId,
            laboratoryId,
            customFields,
            identifier,
            birthDate,
            genotype,
            location,
            strain,
            status,
            origin,
            userId,
            name,
            sex,
        } = req.body;

        // Check required fields
        if (!identifier || !laboratoryId) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: identifier, laboratoryId'
            });
        }

        // Check that either animalTypeId or newAnimalType is provided
        if (!animalTypeId && !newAnimalType) {
            return res.status(400).json({
                success: false,
                message: 'Either animalTypeId or newAnimalType must be provided'
            });
        }

        // Check if laboratory exists
        const laboratory = await prismaClient.laboratory.findFirst({
            where: {
                name: laboratoryId,
                users: {
                    some:   {
                        userId: userId,
                        accessStatus: AccessStatus.ACTIVE
                    }
                }
            }
        });

        if (!laboratory) {
            return res.status(404).json({
                success: false,
                message: 'Laboratory not found'
            });
        }

        // Check if animal with this identifier already exists in this laboratory
        const existingAnimal = await animalClient.findFirst({
            where: {
                identifier: identifier,
                laboratoryId: laboratory.id
            }
        });

        if (existingAnimal) {
            return res.status(409).json({
                success: false,
                message: 'Animal with this identifier already exists in this laboratory'
            });
        }

        let finalAnimalTypeId = animalTypeId;
        let createdAnimalType: AnimalType | null = null;
        let usedExistingType = false;

        // Create new animal type if provided
        if (!animalTypeId && newAnimalType) {
            // Validate newAnimalType fields
            if (!newAnimalType.name) {
                return res.status(400).json({
                    success: false,
                    message: 'newAnimalType.name is required'
                });
            }

            // Check if animal type with this name already exists in this laboratory
            const existingType = await prismaClient.animalType.findFirst({
                where: {
                    name: newAnimalType.name,
                    laboratoryId: laboratory.id
                }
            });

            if (existingType) {
                // Use existing animal type instead of creating a new one
                finalAnimalTypeId = existingType.id;
                usedExistingType = true;
            } else {
                // Create new animal type
                createdAnimalType = await prismaClient.animalType.create({
                    data: {
                        name: newAnimalType.name,
                        description: newAnimalType.description || null,
                        laboratoryId: laboratory.id
                    }
                });

                finalAnimalTypeId = createdAnimalType.id;
            }

            // Create custom fields for the new animal type if provided
            if (newAnimalType.customFields && Array.isArray(newAnimalType.customFields) && createdAnimalType) {
                const customFieldPromises = newAnimalType.customFields.map((field: CustomFieldInput) => 
                    prismaClient.customField.create({
                        data: {
                            name: field.name,
                            fieldType: field.fieldType,
                            isRequired: field.isRequired || false,
                            defaultValue: field.defaultValue || null,
                            description: field.description || null,
                            animalTypeId: createdAnimalType!.id
                        }
                    })
                );
                await Promise.all(customFieldPromises);
            }
        } else if (animalTypeId) {
            // Check if provided animalType exists
            const animalType = await prismaClient.animalType.findUnique({
                where: { id: animalTypeId }
            });

            if (!animalType) {
                return res.status(404).json({
                    success: false,
                    message: 'Animal type not found'
                });
            }
        }

        // Create animal
        const animal = await animalClient.create({
            data: {
                status: (status as AnimalStatus) || AnimalStatus.ACTIVE,
                birthDate: birthDate ? new Date(birthDate) : null,
                acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : new Date(),
                genotype: genotype || null,
                location: location || null,
                sex: sex as Sex || null,
                strain: strain || null,
                origin: origin || null,
                name: name || null,
                animalTypeId: finalAnimalTypeId,
                laboratoryId: laboratory.id,
                identifier,
            },
            include: {
                animalType: true,
                laboratory: {
                    select: {
                        name: true,
                        id: true,
                    }
                }
            }
        });

        // Create custom field values if provided
        if (customFields && Array.isArray(customFields)) {
            const customFieldPromises = customFields.map(field => 
                prismaClient.customFieldValue.create({
                    data: {
                        animalId: animal.id,
                        customFieldId: field.customFieldId,
                        value: field.value
                    }
                })
            );
            await Promise.all(customFieldPromises);
        }

        const response: any = {
            success: true,
            data: animal,
            message: 'Animal created successfully'
        };

        // Include created animal type in response if it was created
        if (createdAnimalType) {
            response.createdAnimalType = createdAnimalType;
            response.message = 'Animal and animal type created successfully';
        } else if (usedExistingType) {
            response.message = 'Animal created successfully using existing animal type';
        }

        res.status(201).json(response);
    } catch (error) {
        console.error('Error creating animal:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create animal',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};