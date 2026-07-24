export type EmailContent = {
  key: string;
  /** Highest V.n used from the Word log, or null if unversioned */
  versionUsed: number | null;
  sourcePath: string;
  subjectHint: string | null;
  body: string;
};
