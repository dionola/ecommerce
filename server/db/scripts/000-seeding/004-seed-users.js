"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = __importDefault(require("pg"));
require("dotenv/config");
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const cognito_1 = require("../../../config/cognito");
const { Pool } = pg_1.default;
const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});
const usersToSeed = [
    {
        email: 'user@example.com',
        password: 'TestUser123!',
        fullName: 'Test User',
        groups: [],
    },
    {
        email: 'admin@admin.com',
        password: 'admin',
        fullName: 'Default Admin',
        groups: ['admin'],
    },
    {
        email: 'superadmin@example.com',
        password: 'TestSuperAdmin123!',
        fullName: 'Test Superadmin',
        groups: ['superadmin'],
    },
];
async function createCognitoUser(email, password, fullName) {
    try {
        // Try to create user in Cognito
        const createUserResponse = await cognito_1.cognitoClient.send(new client_cognito_identity_provider_1.AdminCreateUserCommand({
            UserPoolId: cognito_1.cognitoConfig.userPoolId,
            Username: email,
            UserAttributes: [
                { Name: 'email', Value: email },
                { Name: 'email_verified', Value: 'true' },
                { Name: 'name', Value: fullName },
            ],
            MessageAction: 'SUPPRESS', // Don't send welcome email
            DesiredDeliveryMediums: [],
        }));
        const cognitoSub = createUserResponse.User?.Attributes?.find((attr) => attr.Name === 'sub')?.Value;
        if (!cognitoSub) {
            throw new Error(`Failed to get sub for user ${email}`);
        }
        // Set permanent password
        await cognito_1.cognitoClient.send(new client_cognito_identity_provider_1.AdminSetUserPasswordCommand({
            UserPoolId: cognito_1.cognitoConfig.userPoolId,
            Username: email,
            Password: password,
            Permanent: true,
        }));
        return cognitoSub;
    }
    catch (error) {
        // If user already exists, get their sub and update password
        if (error.name === 'UsernameExistsException' || error.name === 'AliasExistsException') {
            console.log(`ℹ️  User ${email} already exists in Cognito, updating password...`);
            // Get existing user to retrieve sub
            const getUserResponse = await cognito_1.cognitoClient.send(new client_cognito_identity_provider_1.AdminGetUserCommand({
                UserPoolId: cognito_1.cognitoConfig.userPoolId,
                Username: email,
            }));
            const cognitoSub = getUserResponse.UserAttributes?.find((attr) => attr.Name === 'sub')?.Value;
            if (!cognitoSub) {
                throw new Error(`Failed to get sub for existing user ${email}`);
            }
            // Update password for existing user
            await cognito_1.cognitoClient.send(new client_cognito_identity_provider_1.AdminSetUserPasswordCommand({
                UserPoolId: cognito_1.cognitoConfig.userPoolId,
                Username: email,
                Password: password,
                Permanent: true,
            }));
            return cognitoSub;
        }
        throw error;
    }
}
async function addUserToGroups(email, groups) {
    for (const groupName of groups) {
        try {
            await cognito_1.cognitoClient.send(new client_cognito_identity_provider_1.AdminAddUserToGroupCommand({
                UserPoolId: cognito_1.cognitoConfig.userPoolId,
                Username: email,
                GroupName: groupName,
            }));
            console.log(`  ✓ Added ${email} to group: ${groupName}`);
        }
        catch (error) {
            // If user is already in group, that's fine (idempotent)
            if (error.name === 'ResourceNotFoundException') {
                console.warn(`  ⚠️  Group ${groupName} does not exist. Please create it in Cognito first.`);
            }
            else if (error.name === 'InvalidParameterException' ||
                (error.message && error.message.includes('already exists'))) {
                console.log(`  ℹ️  User ${email} already in group: ${groupName}`);
            }
            else {
                // For other errors, log but don't fail completely
                console.warn(`  ⚠️  Could not add ${email} to group ${groupName}: ${error.message || error.name}`);
            }
        }
    }
}
async function createDbUser(client, cognitoSub, email, fullName, role) {
    await client.query(`INSERT INTO users (cognito_sub, email, full_name, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (cognito_sub) DO UPDATE
     SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role`, [cognitoSub, email, fullName, role]);
    console.log(`  ✓ Created/updated DB record for ${email}`);
}
async function seedUsers() {
    const dbClient = await pool.connect();
    try {
        await dbClient.query('BEGIN');
        console.log('🚀 Starting user seed...\n');
        for (const userData of usersToSeed) {
            console.log(`📝 Processing user: ${userData.email}`);
            try {
                // Create user in Cognito
                const cognitoSub = await createCognitoUser(userData.email, userData.password, userData.fullName);
                console.log(`  ✓ Created user in Cognito (sub: ${cognitoSub})`);
                // Add to groups if specified
                if (userData.groups && userData.groups.length > 0) {
                    await addUserToGroups(userData.email, userData.groups);
                }
                // Create DB record
                await createDbUser(dbClient, cognitoSub, userData.email, userData.fullName, userData.groups?.includes('superadmin')
                    ? 'superadmin'
                    : userData.groups?.includes('admin')
                        ? 'admin'
                        : 'customer');
                console.log(`✅ Successfully seeded user: ${userData.email}\n`);
            }
            catch (error) {
                console.error(`❌ Failed to seed user ${userData.email}:`, error.message);
                // Continue with next user instead of failing completely
            }
        }
        await dbClient.query('COMMIT');
        console.log('✅ User seed completed successfully!');
    }
    catch (err) {
        await dbClient.query('ROLLBACK');
        console.error('❌ User seed failed:', err);
        throw err;
    }
    finally {
        dbClient.release();
        await pool.end();
    }
}
seedUsers().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
