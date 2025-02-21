import { expect } from '@std/expect/expect';
import { test } from '@std/testing/bdd';
import { determineEndpointName } from './determine-endpoint-name.ts';

test('returns the operationId if it exists', () => {
  const endpointInfo = {
    method: 'get',
    path: '/users',
    operation: { operationId: 'getUserList' },
  };
  expect(determineEndpointName(endpointInfo)).toBe('getUserList');
});

test('returns a generated name based on the method and path if operationId is not present', () => {
  const endpointInfo = { method: 'post', path: '/users/{userId}/comments', operation: {} };
  expect(determineEndpointName(endpointInfo)).toBe('post_users_:userId_comments');
});

test('replaces path parameters with their names in the generated name', () => {
  const endpointInfo = {
    method: 'get',
    path: '/users/{userId}/comments/{commentId}',
    operation: {},
  };
  expect(determineEndpointName(endpointInfo)).toBe('get_users_:userId_comments_:commentId');
});

test('replaces slashes in the path with underscores in the generated name', () => {
  const endpointInfo = { method: 'put', path: '/users/{userId}/profile-picture', operation: {} };
  expect(determineEndpointName(endpointInfo)).toBe('put_users_:userId_profile-picture');
});
