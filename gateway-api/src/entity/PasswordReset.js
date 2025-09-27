const { EntitySchema } = require('typeorm');

// PasswordReset entity for forgot password functionality
const PasswordReset = new EntitySchema({
  name: 'PasswordReset',
  tableName: 'password_resets',
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
    },
    otp_hash: {
      type: 'varchar',
      length: 255,
      nullable: false,
    },
    expires_at: {
      type: 'datetime',
      nullable: false,
    },
    used: {
      type: 'boolean',
      default: false,
      nullable: false,
    },
    otp_verified: {
      type: 'boolean',
      default: false,
      nullable: false,
    },
    created_at: {
      type: 'timestamp',
      createDate: true,
    },
  },
  indices: [
    {
      name: 'IDX_PASSWORD_RESET_EMAIL',
      columns: ['email'],
    },
    {
      name: 'IDX_PASSWORD_RESET_EXPIRES_AT',
      columns: ['expires_at'],
    },
    {
      name: 'IDX_PASSWORD_RESET_EMAIL_USED',
      columns: ['email', 'used'],
    },
  ],
});

module.exports = PasswordReset;
