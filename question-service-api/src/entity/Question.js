const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Question',
  tableName: 'questions',
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
    created_at: {
      type: 'datetime',
      nullable: false,
      default: () => 'CURRENT_TIMESTAMP',
    },
    updated_at: {
      type: 'datetime',
      nullable: false,
      default: () => 'CURRENT_TIMESTAMP',
      onUpdate: 'CURRENT_TIMESTAMP',
    },
    level: {
      type: 'int',
      nullable: false,
    },
    type: {
      type: 'varchar',
      length: 255,
      nullable: false,
    },
    teacher_id: {
      type: 'uuid',
      nullable: false,
    },
  },
  relations: {
    answers: {
      type: 'one-to-many',
      target: 'Answer',
      inverseSide: 'question',
      cascade: true,
    },
    subjectQuestions: {
      type: 'one-to-many',
      target: 'SubjectQuestion',
      inverseSide: 'question',
      cascade: true,
    },
  },
});
