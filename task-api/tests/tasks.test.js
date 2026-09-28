const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Task API', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('GET /tasks', () => {
    test('should return all tasks', async () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });

      const response = await request(app)
        .get('/tasks');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe('Task 1');
      expect(response.body[1].title).toBe('Task 2');
    });

    test('should return an empty array when there are no tasks', async () => {
      const response = await request(app)
        .get('/tasks');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /tasks?status=', () => {
    test('should filter tasks by status', async () => {
      taskService.create({
        title: 'Todo task',
        status: 'todo',
      });

      taskService.create({
        title: 'Done task',
        status: 'done',
      });

      const response = await request(app)
        .get('/tasks?status=todo');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('todo');
    });

    test('should return an empty array for a status with no matching tasks', async () => {
      taskService.create({
        title: 'Todo task',
        status: 'todo',
      });

      const response = await request(app)
        .get('/tasks?status=done');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /tasks?page=&limit=', () => {
    test('should return the first page of tasks', async () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      taskService.create({ title: 'Task 3' });

      const response = await request(app)
        .get('/tasks?page=1&limit=2');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe('Task 1');
      expect(response.body[1].title).toBe('Task 2');
    });
  });

  describe('POST /tasks', () => {
    test('should create a task', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          title: 'New task',
          description: 'Test description',
          status: 'todo',
          priority: 'high',
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('New task');
      expect(response.body.priority).toBe('high');
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    test('should reject a task without a title', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          description: 'No title',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should reject an invalid status', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          title: 'Invalid task',
          status: 'invalid_status',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('status');
    });
  });

  describe('PUT /tasks/:id', () => {
    test('should update an existing task', async () => {
      const task = taskService.create({
        title: 'Original title',
      });

      const response = await request(app)
        .put(`/tasks/${task.id}`)
        .send({
          title: 'Updated title',
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated title');
      expect(response.body.id).toBe(task.id);
    });

    test('should return 404 for a non-existent task', async () => {
      const response = await request(app)
        .put('/tasks/non-existent-id')
        .send({
          title: 'Updated',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    test('should reject an invalid priority', async () => {
      const task = taskService.create({
        title: 'Test task',
      });

      const response = await request(app)
        .put(`/tasks/${task.id}`)
        .send({
          priority: 'invalid_priority',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('priority');
    });
  });

  describe('DELETE /tasks/:id', () => {
    test('should delete an existing task', async () => {
      const task = taskService.create({
        title: 'Delete me',
      });

      const response = await request(app)
        .delete(`/tasks/${task.id}`);

      expect(response.status).toBe(204);

      const deletedTask = taskService.findById(task.id);

      expect(deletedTask).toBeUndefined();
    });

    test('should return 404 for a non-existent task', async () => {
      const response = await request(app)
        .delete('/tasks/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    test('should mark a task as completed', async () => {
      const task = taskService.create({
        title: 'Complete me',
        priority: 'high',
      });

      const response = await request(app)
        .patch(`/tasks/${task.id}/complete`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('done');
      expect(response.body.priority).toBe('medium');
      expect(response.body.completedAt).toBeDefined();
    });

    test('should return 404 for a non-existent task', async () => {
      const response = await request(app)
        .patch('/tasks/non-existent-id/complete');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('GET /tasks/stats', () => {
    test('should return task statistics', async () => {
      taskService.create({
        title: 'Todo task',
        status: 'todo',
      });

      taskService.create({
        title: 'Done task',
        status: 'done',
      });

      const response = await request(app)
        .get('/tasks/stats');

      expect(response.status).toBe(200);
      expect(response.body.todo).toBe(1);
      expect(response.body.done).toBe(1);
      expect(response.body.in_progress).toBe(0);
      expect(response.body.overdue).toBe(0);
    });

    test('should count unfinished overdue tasks', async () => {
      taskService.create({
        title: 'Overdue task',
        status: 'todo',
        dueDate: '2020-01-01T00:00:00.000Z',
      });

      const response = await request(app)
        .get('/tasks/stats');

      expect(response.status).toBe(200);
      expect(response.body.overdue).toBe(1);
    });

    test('should not count completed overdue tasks', async () => {
      taskService.create({
        title: 'Completed overdue task',
        status: 'done',
        dueDate: '2020-01-01T00:00:00.000Z',
      });

      const response = await request(app)
        .get('/tasks/stats');

      expect(response.status).toBe(200);
      expect(response.body.overdue).toBe(0);
    });
  });
    describe('PATCH /tasks/:id/assign', () => {
    test('should assign a task to a user', async () => {
      const task = taskService.create({
        title: 'Assign me',
      });

      const response = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({
          assignee: 'Ashu',
        });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(task.id);
      expect(response.body.assignee).toBe('Ashu');
    });

    test('should return 404 for a non-existent task', async () => {
      const response = await request(app)
        .patch('/tasks/non-existent-id/assign')
        .send({
          assignee: 'Ashu',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    test('should reject an empty assignee', async () => {
      const task = taskService.create({
        title: 'Assign me',
      });

      const response = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({
          assignee: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should reject assigning a task that is already assigned', async () => {
      const task = taskService.create({
        title: 'Already assigned',
      });

      await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({
          assignee: 'First User',
        });

      const response = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({
          assignee: 'Second User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });
});