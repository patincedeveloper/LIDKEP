import { successResponse } from '../lib/http.js';
import * as innovationsService from '../services/innovations.service.js';

export async function list(req, res) {
  res.json(successResponse(req, await innovationsService.listInnovations(req.user)));
}

export async function show(req, res) {
  res.json(successResponse(req, await innovationsService.getInnovation(req.user, req.validated.params.id)));
}

export async function create(req, res) {
  const innovation = await innovationsService.createInnovation(req.user, req.validated.body, req.requestId);
  res.status(201).json(successResponse(req, innovation));
}

export async function update(req, res) {
  res.json(successResponse(req, await innovationsService.updateInnovation(req.user, req.validated.params.id, req.validated.body, req.requestId)));
}

export async function submit(req, res) {
  res.json(successResponse(req, await innovationsService.submitInnovation(req.user, req.validated.params.id, req.requestId)));
}

export async function addMilestone(req, res) {
  const innovation = await innovationsService.addMilestone(req.user, req.validated.params.id, req.validated.body, req.requestId);
  res.status(201).json(successResponse(req, innovation));
}

export async function uploadEvidence(req, res) {
  const evidence = await innovationsService.addEvidence(req.user, req.params.id, req.file, req.body.visibility, req.requestId);
  res.status(201).json(successResponse(req, evidence));
}

export async function downloadEvidence(req, res) {
  const result = await innovationsService.getEvidenceDownload(req.user, req.params.id, req.params.evidenceId);
  res.download(result.filePath, result.evidence.originalName);
}

export async function respondRevision(req, res) {
  await innovationsService.respondToRevision(req.user, req.validated.params.id, req.validated.params.revisionId, req.validated.body.response, req.requestId);
  res.json(successResponse(req, { responded: true }));
}
