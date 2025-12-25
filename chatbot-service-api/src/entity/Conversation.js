const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Conversation',
  tableName: 'conversations',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    account_id: {
      type: 'uuid',
      nullable: false,
      comment: 'ID từ Account (gateway_db)',
    },
    title: {
      type: 'varchar',
      length: 255,
      default: 'Cuộc hội thoại mới',
    },
    created_at: {
      type: 'timestamp',
      nullable: false,
      default: () => 'CURRENT_TIMESTAMP',
    },
  },
  indices: [
    {
      name: 'IDX_CONVERSATION_ACCOUNT_ID',
      columns: ['account_id'],
    },
  ],
});

