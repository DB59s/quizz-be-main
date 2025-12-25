const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'SubjectQuestion',
  tableName: 'subject_questions',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    subject_id: {
      type: 'uuid',
      nullable: false,
    },
    question_id: {
      type: 'uuid',
      nullable: false,
    },
  },
  relations: {
    subject: {
      type: 'many-to-one',
      target: 'Subject',
      joinColumn: {
        name: 'subject_id',
        referencedColumnName: 'id',
      },
      onDelete: 'CASCADE',
    },
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
