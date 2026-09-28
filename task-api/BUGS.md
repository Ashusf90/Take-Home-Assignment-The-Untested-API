# Bug Report

## Bug 1: Pagination starts from the wrong offset

### Endpoint

GET /tasks?page=1&limit=2

### Expected Behavior

When requesting the first page with a limit of 2, the API should return the first two tasks:
- Task 1
- Task 2

### Actual Behavior

The API returns only:
- Task 3

### How It Was Discovered

An integration test was written using Jest and Supertest.

The test created three tasks and requested:

GET /tasks?page=1&limit=2

The test expected two tasks but received only one task, which was Task 3.

### Root Cause
In `src/services/taskService.js`, pagination calculates the offset as:

```javascript
const offset = page * limit;