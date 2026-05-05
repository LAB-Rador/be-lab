import type { Request, Response } from 'express';

const mockUpdate = jest.fn();
const mockFindMany = jest.fn();
const mockFindUnique = jest.fn();
const mockDelete = jest.fn();

jest.unstable_mockModule('../src/lib/prisma.js', () => ({
    prismaClient: {
        user: {
            update: mockUpdate,
            findMany: mockFindMany,
            findUnique: mockFindUnique,
            delete: mockDelete,
        },
    },
}));

describe('user.controller — sensitive fields', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('getAllUsers does not request password from the database', async () => {
        const { getAllUsers } = await import('../src/controllers/user/user.controller.js');
        mockFindMany.mockResolvedValue([]);

        const req = {} as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;

        await getAllUsers(req, res);

        const arg = mockFindMany.mock.calls[0][0];
        expect(arg.select).toBeDefined();
        expect(arg.select).not.toHaveProperty('password');
    });

    it('updateUser strips password and other non-profile keys from Prisma data', async () => {
        const { updateUser } = await import('../src/controllers/user/user.controller.js');
        mockUpdate.mockResolvedValue({
            id: 'u1',
            email: 'a@b.c',
            password: 'hash',
            firstName: 'A',
            lastName: 'B',
            address: null,
            contactPhone: null,
            institution: null,
            confirmedEmail: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const req = {
            params: { id: 'u1' },
            body: {
                firstName: 'X',
                password: 'hunter2',
                confirmedEmail: false,
                id: 'other',
            },
        } as unknown as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;

        await updateUser(req, res);

        expect(mockUpdate).toHaveBeenCalledWith({
            where: { id: 'u1' },
            data: { firstName: 'X' },
        });
    });
});
