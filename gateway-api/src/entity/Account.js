const { EntitySchema } = require('typeorm');

// Account entity for authentication
const Account = new EntitySchema({
  name: 'Account',
  tableName: 'accounts',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    email: {
      type: 'varchar',
      length: 255,
      nullable: false,
      unique: true,
    },
    password_hash: {
      type: 'varchar',
      length: 255,
      nullable: true, // Made nullable for Google OAuth users
    },
    google_id: {
      type: 'varchar',
      length: 255,
      nullable: true,
      unique: true,
    },
    provider: {
      type: 'enum',
      enum: ['local', 'google'],
      default: 'local',
      nullable: false,
    },
    role: {
      type: 'enum',
      enum: ['student', 'teacher', 'admin'],
      default: 'student',
      nullable: false,
    },
    status: {
      type: 'enum',
      enum: ['active', 'pending', 'banned', 'deleted'],
      default: 'active',
      nullable: false,
    },
    created_at: {
      type: 'timestamp',
      createDate: true,
    },
    updated_at: {
      type: 'timestamp',
      updateDate: true,
    },
  },
  indices: [
    {
      name: 'IDX_ACCOUNT_EMAIL',
      columns: ['email'],
      unique: true,
    },
    {
      name: 'IDX_ACCOUNT_GOOGLE_ID',
      columns: ['google_id'],
      unique: true,
    },
  ],
});

module.exports = Account; 