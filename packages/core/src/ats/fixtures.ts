/** Synthetic Gate B corpus (Alex / Nordlicht). No real candidate PII. */

export const ALEX_RESUME = `Alex Morgan
alex.morgan@example.com
+49 30 1234567
Berlin, Germany

Skills: TypeScript, React, Node.js, GraphQL

Experience
Senior Frontend Engineer, Example GmbH 2019 - 2024
`;

export const ALEX_RESUME_MINIMAL = `Alex Morgan
alex@example.com
+49 30 1234567
Berlin, Germany
Skills: TypeScript, React
`;

export const NORDLICHT_POSTING = `Nordlicht — Senior Frontend Engineer

About us
Nordlicht builds climate dashboards.

Requirements
- Strong TypeScript experience
- Production React applications

Nice to have
- GraphQL
- Experience with design systems
`;

export const EXPECTED_ALEX_SKILLS = ["TypeScript", "React", "Node.js", "GraphQL"] as const;
