const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Subject',
  tableName: 'subjects',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    name: {
      type: 'varchar',
      length: 255,
      nullable: false,
      unique: true,
    },
  },
  relations: {
    subjectQuestions: {
      type: 'one-to-many',
      target: 'SubjectQuestion',
      inverseSide: 'subject',
      cascade: true,
    },
  },
});
