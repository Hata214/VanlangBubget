/**
 * @jest-environment node
 */

import mongoose from 'mongoose';

describe('Budget Service - Import Test', () => {
    test('Mongoose should be defined', () => {
        expect(mongoose).toBeDefined();
    });
}); 