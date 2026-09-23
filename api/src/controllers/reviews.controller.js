import { successResponse } from '../lib/http.js';
import * as reviewsService from '../services/reviews.service.js';

export const assignments = async (req, res) => res.json(successResponse(req, await reviewsService.listAssignments(req.user)));
export const assignment = async (req, res) => res.json(successResponse(req, await reviewsService.getAssignment(req.user, req.validated.params.assignmentId)));
export const save = async (req, res) => res.json(successResponse(req, await reviewsService.saveReview(req.user, req.validated.params.assignmentId, req.validated.body, req.requestId)));
export const submit = async (req, res) => res.json(successResponse(req, await reviewsService.submitReview(req.user, req.validated.params.assignmentId, req.requestId)));
