#!/usr/bin/env zx

// This script should be run after editing prisma/schema.prisma (or probably
// after changing prisma/seed.ts).
// It prompts for migration_name and runs:
//      prisma migrate dev --name <migration_name>

import { question } from "zx/.";

let migration_name = await question('Enter migration name: ')
await $`prisma migrate dev --name ${migration_name}`
