const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Answer',
  tableName: 'answers',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    content: {
      type: 'varchar',
      length: 255,
      nullable: false,
    },
    is_true: {
      type: 'boolean',
      nullable: false,
      default: false,
    },
    question_id: {
      type: 'uuid',
      nullable: false,
    },
  },
  relations: {
    question: {
      type: 'many-to-one',
      target: 'Question',
      joinColumn: {
        name: 'question_id',
        referencedColumnName: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
});
