const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'QuizQuestion',
  tableName: 'quiz_question',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    quizz_id: {
      type: 'uuid',
      nullable: false,
    },
    question_id: {
      type: 'uuid',
      nullable: false,
    },
  },
  relations: {
    quiz: {
      type: 'many-to-one',
      target: 'Quiz',
      joinColumn: {
        name: 'quizz_id',
        referencedColumnName: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
});
