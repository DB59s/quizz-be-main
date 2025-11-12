const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'ChatMessage',
  tableName: 'chat_messages',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    conversation_id: {
      type: 'uuid',
      nullable: false,
    },
    role: {
      type: 'enum',
      enum: ['user', 'model'],
      nullable: false,
    },
    content: {
      type: 'text',
      nullable: false,
    },
    created_at: {
      type: 'timestamp',
      nullable: false,
      default: () => 'CURRENT_TIMESTAMP',
    },
  },
  relations: {
    conversation: {
      type: 'many-to-one',
      target: 'Conversation',
      joinColumn: { name: 'conversation_id' },
      onDelete: 'CASCADE',
    },
  },
  indices: [
    {
      name: 'IDX_CHAT_MESSAGE_CONVERSATION_ID',
      columns: ['conversation_id'],
    },
  ],
});

