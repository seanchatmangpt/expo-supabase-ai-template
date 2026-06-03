import { seed } from 'drizzle-seed';
import { db } from './db';
import * as schema from './schema';

export async function initializeAndSeedDatabase() {
  try {
    console.log('[Seeder] Checking if database needs seeding...');
    
    // Check if actor_events is empty
    const result = await db.select().from(schema.actorEvents).limit(1);
    
    if (result.length === 0) {
      console.log('[Seeder] Database is empty! Generating synthetic population...');
      
      // Use drizzle-seed to populate tables according to schema types
      // @ts-ignore - drizzle-seed TS types are currently very strict on schema matching, bypassing for simplicity
      await seed(db as any, schema as any, { count: 100 }).refine((f) => ({
        actorEvents: {
          columns: {
            type: f.valuesFromArray({ values: ['login', 'click', 'scroll', 'type', 'logout', 'purchase', 'authenticate', 'verify'] }),
            payload: f.default({ defaultValue: '{"simulated": true, "x": 10, "y": 20}' }),
            createdAt: f.int({ minValue: Date.now() - 1000000, maxValue: Date.now() })
          }
        },
        actorCommands: {
          columns: {
            command: f.valuesFromArray({ values: ['Init', 'Update', 'Submit'] }),
            status: f.valuesFromArray({ values: ['pending', 'processed'] }),
            payload: f.default({ defaultValue: '{"simulated": true}' })
          }
        }
      }));

      console.log('[Seeder] Successfully seeded database with realistic mock data.');
    } else {
      console.log('[Seeder] Database already contains data. Skipping seed.');
    }
  } catch (error) {
    console.error('[Seeder] Failed to seed database:', error);
  }
}
