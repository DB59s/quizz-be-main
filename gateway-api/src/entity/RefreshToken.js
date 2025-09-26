const { EntitySchema } = require('typeorm');

// RefreshToken entity for token management
const RefreshToken = new EntitySchema({
  name: 'RefreshToken',
  tableName: 'refresh_tokens',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    account_id: {
      type: 'uuid',
      nullable: false,
    },
    token: {
      type: 'varchar',
      length: 255,
      nullable: false,
    },
    expires_at: {
      type: 'timestamp',
      nullable: false,
    },
    created_at: {
      type: 'timestamp',
      createDate: true,
    },
  },
  relations: {
    account: {
      type: 'many-to-one',
      target: 'Account',
      joinColumn: {
        name: 'account_id',
        referencedColumnName: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  indices: [
    {
      name: 'IDX_REFRESH_TOKEN_ACCOUNT',
      columns: ['account_id'],
    },
    {
      name: 'IDX_REFRESH_TOKEN_TOKEN',
      columns: ['token'],
    },
  ],
});

module.exports = RefreshToken; 