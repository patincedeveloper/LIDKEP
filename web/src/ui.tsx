import styled from "@emotion/styled";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  ExternalLink,
  Leaf,
  LoaderCircle,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cloneElement, isValidElement, useId } from "react";
import { palette } from "./styles";

export const Brand = ({ compact = false }: { compact?: boolean }) => (
  <BrandLink to="/">
    <BrandMark>
      <Leaf size={19} />
    </BrandMark>
    {!compact && <span>LIDKEP</span>}
  </BrandLink>
);
const BrandLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  letter-spacing: -0.04em;
  font-weight: 700;
  white-space: nowrap;
  font-family: Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
`;
const BrandMark = styled.span`
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  color: white;
  background: ${palette.green};
  border-radius: 11px 11px 11px 3px;
`;

export const Button = styled.button<{
  $variant?: "primary" | "secondary" | "quiet" | "danger";
}>`
  min-height: 44px;
  border-radius: 9px;
  padding: 0 16px;
  border: 1px solid
    ${({ $variant }) =>
      $variant === "danger"
        ? palette.danger
        : $variant === "quiet"
          ? "transparent"
          : $variant === "secondary"
            ? palette.line
            : palette.green};
  background: ${({ $variant }) =>
    $variant === "danger"
      ? palette.danger
      : $variant === "secondary" || $variant === "quiet"
        ? "transparent"
        : palette.green};
  color: ${({ $variant }) =>
    $variant === "secondary" || $variant === "quiet" ? palette.ink : "white"};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 700;
  transition: 0.18s ease;
  &:hover:not(:disabled) {
    background: ${({ $variant }) =>
      $variant === "danger"
        ? "#912018"
        : $variant === "quiet"
          ? palette.soft
          : $variant === "secondary"
            ? palette.soft
            : palette.greenDark};
  }
`;
export const ButtonLink = styled(Link, {
  shouldForwardProp: (prop) => prop !== "$variant",
})<{ $variant?: "primary" | "secondary" | "quiet" }>`
  min-height: 44px;
  border-radius: 9px;
  padding: 0 16px;
  border: 1px solid
    ${({ $variant }) =>
      $variant === "quiet"
        ? "transparent"
        : $variant === "secondary"
          ? palette.line
          : palette.green};
  background: ${({ $variant }) =>
    $variant === "secondary" || $variant === "quiet"
      ? "transparent"
      : palette.green};
  color: ${({ $variant }) =>
    $variant === "secondary" || $variant === "quiet" ? palette.ink : "white"};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 700;
  transition: 0.18s ease;
  &:hover {
    background: ${({ $variant }) =>
      $variant === "quiet" || $variant === "secondary"
        ? palette.soft
        : palette.greenDark};
  }
`;

export const PageHeader = ({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) => (
  <PageHeaderWrap>
    <div>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
    {action && <ActionWrap>{action}</ActionWrap>}
  </PageHeaderWrap>
);
const PageHeaderWrap = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
  h1 {
    font-family: Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: clamp(24px, 2.8vw, 34px);
    letter-spacing: -0.04em;
    line-height: 1.12;
    margin: 5px 0 7px;
    font-weight: 700;
  }
  p {
    color: ${palette.muted};
    margin: 0;
    max-width: 680px;
    font-size: 16px;
    line-height: 1.55;
  }
  @media (max-width: 650px) {
    flex-direction: column;
  }
`;
const ActionWrap = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;
export const Eyebrow = styled.div`
  color: ${palette.green};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  font-family: Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
`;

export const Panel = styled.section`
  background: white;
  border: 1px solid ${palette.line};
  border-radius: 14px;
  box-shadow: 0 1px 2px #102a2708;
`;
export const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid ${palette.line};
  h2,
  h3 {
    margin: 0;
    font-size: 18px;
    font-family: Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  }
  p {
    margin: 2px 0 0;
    color: ${palette.muted};
    font-size: 14px;
  }
`;
export const PanelBody = styled.div`
  padding: 20px;
`;

export const StatusBadge = ({ status }: { status: string }) => {
  const lower = status.toLowerCase();
  const tone =
    lower.includes("publish") ||
    lower.includes("active") ||
    lower.includes("complete") ||
    lower.includes("accept") ||
    lower.includes("approve")
      ? "success"
      : lower.includes("reject") ||
          lower.includes("suspend") ||
          lower.includes("report")
        ? "danger"
        : lower.includes("revision") ||
            lower.includes("pending") ||
            lower.includes("progress") ||
            lower.includes("review")
          ? "warning"
          : "neutral";
  return (
    <Badge $tone={tone}>
      {tone === "success" ? (
        <CheckCircle2 size={13} />
      ) : tone === "warning" ? (
        <Clock3 size={13} />
      ) : tone === "danger" ? (
        <CircleAlert size={13} />
      ) : null}
      {status.replaceAll("_", " ")}
    </Badge>
  );
};
const Badge = styled.span<{ $tone: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  width: max-content;
  padding: 5px 8px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0.025em;
  text-transform: uppercase;
  color: ${({ $tone }) =>
    $tone === "success"
      ? palette.success
      : $tone === "warning"
        ? palette.warning
        : $tone === "danger"
          ? palette.danger
          : palette.muted};
  background: ${({ $tone }) =>
    $tone === "success"
      ? palette.successSoft
      : $tone === "warning"
        ? palette.warningSoft
        : $tone === "danger"
          ? palette.dangerSoft
          : "#f2f4f3"};
`;

export const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;
export const StatCard = ({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: React.ReactNode;
}) => (
  <Stat>
    <StatIcon>{icon}</StatIcon>
    <span>{label}</span>
    <strong>{value}</strong>
    {detail && <small>{detail}</small>}
  </Stat>
);
const Stat = styled(Panel)`
  padding: 18px;
  position: relative;
  min-height: 130px;
  span {
    display: block;
    color: ${palette.muted};
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 6px;
  }
  strong {
    font-family: Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: 28px;
    letter-spacing: -0.04em;
    line-height: 1.1;
    font-weight: 700;
  }
  small {
    display: block;
    color: ${palette.success};
    font-size: 11px;
    margin-top: 6px;
    font-weight: 700;
  }
`;
const StatIcon = styled.div`
  position: absolute;
  right: 15px;
  top: 15px;
  color: ${palette.green};
  background: ${palette.soft};
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: grid;
  place-items: center;
`;

export const TableWrap = styled.div`
  overflow-x: auto;
`;
export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 660px;
  th {
    text-align: left;
    color: ${palette.muted};
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    padding: 12px 16px;
    background: #fafcfb;
  }
  td {
    padding: 14px 16px;
    border-top: 1px solid ${palette.line};
    font-size: 14px;
    vertical-align: middle;
  }
  tr:hover td {
    background: #fbfdfb;
  }
  a {
    font-weight: 700;
    color: ${palette.green};
  }
`;

export const EmptyState = ({
  title,
  copy,
  action,
}: {
  title: string;
  copy: string;
  action?: React.ReactNode;
}) => (
  <Empty>
    <Search size={28} />
    <h3>{title}</h3>
    <p>{copy}</p>
    {action}
  </Empty>
);
const Empty = styled.div`
  padding: 55px 24px;
  text-align: center;
  color: ${palette.muted};
  h3 {
    color: ${palette.ink};
    margin: 12px 0 4px;
  }
  p {
    margin: 0 auto 18px;
    max-width: 450px;
  }
`;

export const Field = ({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) => {
  const generatedId = useId();
  const fieldId = `field-${generatedId.replaceAll(":", "")}`;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const element = isValidElement<{
    id?: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
  }>(children)
    ? children
    : null;
  const control = element
    ? cloneElement(element, {
        id: element.props.id ?? fieldId,
        "aria-invalid": Boolean(error),
        "aria-describedby": error
          ? errorId
          : hint
            ? hintId
            : element.props["aria-describedby"],
      })
    : children;
  const controlId = element?.props.id ?? fieldId;
  return (
    <FieldWrap>
      <label htmlFor={controlId}>{label}</label>
      {control}
      {error ? (
        <FieldError id={errorId} role="alert">
          {error}
        </FieldError>
      ) : (
        hint && <small id={hintId}>{hint}</small>
      )}
    </FieldWrap>
  );
};
const FieldWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  label {
    font-size: 13px;
    font-weight: 700;
  }
  small {
    color: ${palette.muted};
    font-size: 11px;
  }
`;
const FieldError = styled.small`
  color: ${palette.danger}!important;
  font-size: 12px !important;
  font-weight: 700;
`;
const invalidStyle = `&[aria-invalid="true"]{border-color:${palette.danger};background:${palette.dangerSoft};&:focus{border-color:${palette.danger};outline:3px solid #b423181f;}}`;
export const Input = styled.input`
  width: 100%;
  min-height: 44px;
  border: 1px solid ${palette.line};
  border-radius: 9px;
  background: white;
  padding: 0 12px;
  color: ${palette.ink};
  &:focus {
    border-color: ${palette.green};
    outline: 3px solid #0b62551a;
  }
  ${invalidStyle}
`;
export const Select = styled.select`
  width: 100%;
  min-height: 44px;
  border: 1px solid ${palette.line};
  border-radius: 9px;
  background: white;
  padding: 0 12px;
  color: ${palette.ink};
  &:focus {
    border-color: ${palette.green};
    outline: 3px solid #0b62551a;
  }
  ${invalidStyle}
`;
export const Textarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  resize: vertical;
  border: 1px solid ${palette.line};
  border-radius: 9px;
  background: white;
  padding: 12px;
  color: ${palette.ink};
  &:focus {
    border-color: ${palette.green};
    outline: 3px solid #0b62551a;
  }
  ${invalidStyle}
`;
export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

export const ProgressBar = ({ value }: { value: number }) => (
  <Progress aria-label={`${value}% complete`}>
    <span style={{ width: `${value}%` }} />
  </Progress>
);
const Progress = styled.div`
  height: 7px;
  background: #e7ece9;
  border-radius: 999px;
  overflow: hidden;
  span {
    display: block;
    height: 100%;
    background: ${palette.green};
    border-radius: inherit;
  }
`;

export const ListLink = ({
  to,
  title,
  meta,
  status,
}: {
  to: string;
  title: string;
  meta: string;
  status?: string;
}) => (
  <ListLinkWrap to={to}>
    <div>
      <strong>{title}</strong>
      <span>{meta}</span>
    </div>
    {status && <StatusBadge status={status} />}
    <ChevronRight size={18} />
  </ListLinkWrap>
);
const ListLinkWrap = styled(Link)`
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 15px 20px;
  border-bottom: 1px solid ${palette.line};
  transition: 0.15s;
  &:last-of-type {
    border: 0;
  }
  &:hover {
    background: #f9fcfa;
  }
  div {
    display: flex;
    flex-direction: column;
  }
  strong {
    font-size: 14px;
  }
  span {
    font-size: 12px;
    color: ${palette.muted};
  }
`;

export const LoadingScreen = () => (
  <StateScreen>
    <LoaderCircle className="spin" size={30} />
    <h2>Preparing your workspace</h2>
    <p>Loading secure platform data...</p>
  </StateScreen>
);
export const ErrorScreen = ({ message }: { message: string }) => (
  <StateScreen>
    <CircleAlert size={32} />
    <h2>We could not load LIDKEP</h2>
    <p>{message}</p>
    <Button onClick={() => location.reload()}>Try again</Button>
  </StateScreen>
);
const StateScreen = styled.main`
  min-height: 100dvh;
  display: grid;
  place-content: center;
  text-align: center;
  padding: 24px;
  color: ${palette.muted};
  svg {
    margin: auto;
    color: ${palette.green};
  }
  .spin {
    animation: spin 1s linear infinite;
  }
  h2 {
    color: ${palette.ink};
    margin: 14px 0 4px;
  }
  p {
    margin: 0 0 18px;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const QuickLink = ({
  to,
  label,
  copy,
}: {
  to: string;
  label: string;
  copy: string;
}) => (
  <QuickLinkWrap to={to}>
    <div>
      <strong>{label}</strong>
      <span>{copy}</span>
    </div>
    <ArrowRight size={18} />
  </QuickLinkWrap>
);
const QuickLinkWrap = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 16px;
  border: 1px solid ${palette.line};
  border-radius: 11px;
  background: white;
  transition: 0.16s;
  &:hover {
    border-color: #a8c8b0;
    box-shadow: 0 7px 20px #102a270a;
  }
  div {
    display: flex;
    flex-direction: column;
  }
  span {
    color: ${palette.muted};
    font-size: 12px;
    margin-top: 2px;
  }
  svg {
    color: ${palette.green};
    flex: none;
  }
`;

export const ExternalAction = ({ children }: { children: React.ReactNode }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
    {children}
    <ExternalLink size={14} />
  </span>
);
