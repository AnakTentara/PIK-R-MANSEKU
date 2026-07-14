import api from './axios';

export const getPosts = (params) =>
  api.get('/blog/posts', { params });

export const getPostBySlug = (slug) =>
  api.get(`/blog/posts/${slug}`);

export const createComment = (postId, data) =>
  api.post(`/blog/posts/${postId}/comments`, data);

export const createPost = (data) =>
  api.post('/blog/posts', data);

export const updatePost = (id, data) =>
  api.put(`/blog/posts/${id}`, data);

export const deletePost = (id) =>
  api.delete(`/blog/posts/${id}`);

export const updateComment = (id, data) =>
  api.put(`/blog/comments/${id}`, data);

export const deleteComment = (id) =>
  api.delete(`/blog/comments/${id}`);
