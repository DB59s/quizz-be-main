const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'ClassQuiz',
  tableName: 'class_quizz',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    start_time: {
      type: 'timestamp',
      nullable: false,
    },
    end_time: {
      type: 'timestamp',
      nullable: false,
    },
    class_id: {
      type: 'varchar',
      length: 255,
      nullable: false,
    },
    quizz_id: {
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
