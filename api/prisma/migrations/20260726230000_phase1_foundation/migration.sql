-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('SYSTEM_ADMINISTRATOR', 'INNOVATOR', 'EXPERT', 'INVESTOR_PARTNER', 'PUBLIC_USER');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'DISABLED', 'LOCKED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InnovationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED', 'RECOMMENDED', 'APPROVED', 'REJECTED', 'ARCHIVED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'AUTHENTICATED', 'REVIEW_TEAM', 'ADMIN_ONLY');

-- CreateEnum
CREATE TYPE "FileScanStatus" AS ENUM ('PENDING', 'CLEAN', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'REVISION_REQUESTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REOPENED');

-- CreateEnum
CREATE TYPE "Recommendation" AS ENUM ('APPROVE', 'REVISION_REQUIRED', 'REJECT');

-- CreateEnum
CREATE TYPE "RevisionStatus" AS ENUM ('OPEN', 'RESPONDED', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EngagementType" AS ENUM ('CONTACT', 'FUNDING_OFFER', 'PARTNERSHIP_REQUEST');

-- CreateEnum
CREATE TYPE "EngagementStatus" AS ENUM ('DRAFT', 'PENDING', 'ACCEPTED', 'DECLINED', 'CLARIFICATION_REQUESTED', 'WITHDRAWN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ConsentScope" AS ENUM ('SHARE_EMAIL', 'SHARE_PHONE', 'SHARE_ORGANIZATION_CONTACT');

-- CreateEnum
CREATE TYPE "TaxonomyType" AS ENUM ('SECTOR', 'CATEGORY', 'DISTRICT', 'MATURITY_LEVEL', 'IMPACT_AREA', 'INNOVATION_TYPE');

-- CreateEnum
CREATE TYPE "CriteriaStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RETIRED');

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "code" "RoleCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "roleId" UUID NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "emailVerifiedAt" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecretEncrypted" TEXT,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "displayName" TEXT NOT NULL,
    "organization" TEXT,
    "biography" TEXT,
    "district" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "publicProfile" BOOLEAN NOT NULL DEFAULT false,
    "privateContactEmail" TEXT,
    "privatePhone" TEXT,
    "contactPreference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "requestedRole" "RoleCode" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "decidedById" UUID,
    "decisionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Innovation" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "InnovationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedVersionId" UUID,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Innovation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InnovationVersion" (
    "id" UUID NOT NULL,
    "innovationId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "beneficiaries" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "maturity" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "supportNeeded" TEXT NOT NULL,
    "organizationSnapshot" TEXT,
    "ownerDisplaySnapshot" TEXT,
    "metrics" JSONB NOT NULL DEFAULT '[]',
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "ownershipDeclaredAt" TIMESTAMP(3),
    "accuracyDeclaredAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "immutableAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InnovationVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceFile" (
    "id" UUID NOT NULL,
    "uploadedById" UUID NOT NULL,
    "innovationVersionId" UUID,
    "milestoneId" UUID,
    "verificationRequestId" UUID,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'REVIEW_TEAM',
    "scanStatus" "FileScanStatus" NOT NULL DEFAULT 'PENDING',
    "publicApprovedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" UUID NOT NULL,
    "innovationId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PLANNED',
    "visibility" "Visibility" NOT NULL DEFAULT 'REVIEW_TEAM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertAssignment" (
    "id" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "expertId" UUID NOT NULL,
    "assignedById" UUID NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "dueAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" UUID NOT NULL,
    "assignmentId" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "criteriaVersionId" UUID NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "recommendation" "Recommendation",
    "totalScore" DECIMAL(5,2),
    "rationale" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewCriterionScore" (
    "id" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "criterionKey" TEXT NOT NULL,
    "criterionName" TEXT NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewCriterionScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevisionRequest" (
    "id" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "response" TEXT,
    "dueAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "status" "RevisionStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevisionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Engagement" (
    "id" UUID NOT NULL,
    "innovationId" UUID NOT NULL,
    "innovationVersionId" UUID NOT NULL,
    "partnerId" UUID NOT NULL,
    "type" "EngagementType" NOT NULL,
    "status" "EngagementStatus" NOT NULL DEFAULT 'DRAFT',
    "summary" TEXT NOT NULL,
    "termsSummary" TEXT,
    "nonBindingAcceptedAt" TIMESTAMP(3),
    "contactSharedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngagementConsent" (
    "id" UUID NOT NULL,
    "engagementId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "scope" "ConsentScope" NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngagementConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "requestId" UUID NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Taxonomy" (
    "id" UUID NOT NULL,
    "type" "TaxonomyType" NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "parentId" UUID,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Taxonomy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationCriteriaVersion" (
    "id" UUID NOT NULL,
    "version" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CriteriaStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" UUID NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "retiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationCriteriaVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationCriterion" (
    "id" UUID NOT NULL,
    "criteriaVersionId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "guidance" TEXT,
    "weight" DECIMAL(5,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "idleExpiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "rotatedFromId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_roleId_status_idx" ON "User"("roleId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "VerificationRequest_status_submittedAt_idx" ON "VerificationRequest"("status", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Innovation_slug_key" ON "Innovation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Innovation_publishedVersionId_key" ON "Innovation"("publishedVersionId");

-- CreateIndex
CREATE INDEX "Innovation_ownerId_status_idx" ON "Innovation"("ownerId", "status");

-- CreateIndex
CREATE INDEX "Innovation_status_publishedAt_idx" ON "Innovation"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "InnovationVersion_innovationId_submittedAt_idx" ON "InnovationVersion"("innovationId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "InnovationVersion_innovationId_versionNumber_key" ON "InnovationVersion"("innovationId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceFile_storageKey_key" ON "EvidenceFile"("storageKey");

-- CreateIndex
CREATE INDEX "EvidenceFile_innovationVersionId_visibility_idx" ON "EvidenceFile"("innovationVersionId", "visibility");

-- CreateIndex
CREATE INDEX "EvidenceFile_verificationRequestId_idx" ON "EvidenceFile"("verificationRequestId");

-- CreateIndex
CREATE INDEX "Milestone_innovationId_status_idx" ON "Milestone"("innovationId", "status");

-- CreateIndex
CREATE INDEX "ExpertAssignment_expertId_status_dueAt_idx" ON "ExpertAssignment"("expertId", "status", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertAssignment_versionId_expertId_key" ON "ExpertAssignment"("versionId", "expertId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_assignmentId_key" ON "Review"("assignmentId");

-- CreateIndex
CREATE INDEX "Review_versionId_status_idx" ON "Review"("versionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewCriterionScore_reviewId_criterionKey_key" ON "ReviewCriterionScore"("reviewId", "criterionKey");

-- CreateIndex
CREATE INDEX "RevisionRequest_versionId_status_idx" ON "RevisionRequest"("versionId", "status");

-- CreateIndex
CREATE INDEX "Engagement_partnerId_status_idx" ON "Engagement"("partnerId", "status");

-- CreateIndex
CREATE INDEX "Engagement_innovationId_status_idx" ON "Engagement"("innovationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EngagementConsent_engagementId_userId_scope_key" ON "EngagementConsent"("engagementId", "userId", "scope");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Taxonomy_type_isActive_sortOrder_idx" ON "Taxonomy"("type", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Taxonomy_type_code_key" ON "Taxonomy"("type", "code");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationCriteriaVersion_version_key" ON "EvaluationCriteriaVersion"("version");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationCriterion_criteriaVersionId_key_key" ON "EvaluationCriterion"("criteriaVersionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Session_rotatedFromId_key" ON "Session"("rotatedFromId");

-- CreateIndex
CREATE INDEX "Session_userId_revokedAt_expiresAt_idx" ON "Session"("userId", "revokedAt", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Innovation" ADD CONSTRAINT "Innovation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Innovation" ADD CONSTRAINT "Innovation_publishedVersionId_fkey" FOREIGN KEY ("publishedVersionId") REFERENCES "InnovationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InnovationVersion" ADD CONSTRAINT "InnovationVersion_innovationId_fkey" FOREIGN KEY ("innovationId") REFERENCES "Innovation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceFile" ADD CONSTRAINT "EvidenceFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceFile" ADD CONSTRAINT "EvidenceFile_innovationVersionId_fkey" FOREIGN KEY ("innovationVersionId") REFERENCES "InnovationVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceFile" ADD CONSTRAINT "EvidenceFile_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceFile" ADD CONSTRAINT "EvidenceFile_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "VerificationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_innovationId_fkey" FOREIGN KEY ("innovationId") REFERENCES "Innovation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertAssignment" ADD CONSTRAINT "ExpertAssignment_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "InnovationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertAssignment" ADD CONSTRAINT "ExpertAssignment_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertAssignment" ADD CONSTRAINT "ExpertAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ExpertAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "InnovationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_criteriaVersionId_fkey" FOREIGN KEY ("criteriaVersionId") REFERENCES "EvaluationCriteriaVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewCriterionScore" ADD CONSTRAINT "ReviewCriterionScore_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionRequest" ADD CONSTRAINT "RevisionRequest_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionRequest" ADD CONSTRAINT "RevisionRequest_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "InnovationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_innovationId_fkey" FOREIGN KEY ("innovationId") REFERENCES "Innovation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_innovationVersionId_fkey" FOREIGN KEY ("innovationVersionId") REFERENCES "InnovationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngagementConsent" ADD CONSTRAINT "EngagementConsent_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngagementConsent" ADD CONSTRAINT "EngagementConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Taxonomy" ADD CONSTRAINT "Taxonomy_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Taxonomy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationCriteriaVersion" ADD CONSTRAINT "EvaluationCriteriaVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationCriterion" ADD CONSTRAINT "EvaluationCriterion_criteriaVersionId_fkey" FOREIGN KEY ("criteriaVersionId") REFERENCES "EvaluationCriteriaVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_rotatedFromId_fkey" FOREIGN KEY ("rotatedFromId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Domain checks that Prisma's schema language cannot currently express.
ALTER TABLE "InnovationVersion"
  ADD CONSTRAINT "InnovationVersion_completionPercent_check"
  CHECK ("completionPercent" BETWEEN 0 AND 100);

ALTER TABLE "EvidenceFile"
  ADD CONSTRAINT "EvidenceFile_sizeBytes_check"
  CHECK ("sizeBytes" >= 0),
  ADD CONSTRAINT "EvidenceFile_single_parent_check"
  CHECK (
    num_nonnulls("innovationVersionId", "milestoneId", "verificationRequestId") = 1
  );

ALTER TABLE "ReviewCriterionScore"
  ADD CONSTRAINT "ReviewCriterionScore_weight_check"
  CHECK ("weight" > 0 AND "weight" <= 100),
  ADD CONSTRAINT "ReviewCriterionScore_score_check"
  CHECK ("score" >= 0 AND "score" <= 100);

ALTER TABLE "EvaluationCriterion"
  ADD CONSTRAINT "EvaluationCriterion_weight_check"
  CHECK ("weight" > 0 AND "weight" <= 100);

-- Once submitted, an innovation version is a permanent review snapshot.
CREATE OR REPLACE FUNCTION prevent_immutable_innovation_version_change()
RETURNS trigger AS $$
BEGIN
  IF OLD."immutableAt" IS NOT NULL THEN
    RAISE EXCEPTION 'submitted innovation versions are immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "InnovationVersion_immutable_update"
BEFORE UPDATE OR DELETE ON "InnovationVersion"
FOR EACH ROW EXECUTE FUNCTION prevent_immutable_innovation_version_change();

-- Audit entries are append-only. Retention must be implemented as a separately governed archive.
CREATE OR REPLACE FUNCTION prevent_audit_log_change()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit logs are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "AuditLog_append_only"
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_change();
