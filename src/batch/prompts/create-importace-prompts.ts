export const createImportancePrompts = (
  keyword: string,
  definition: string,
  json: string,
) => {
  return `# Task: Generate text to help learn economic terms

The following is reference data about "${keyword}":

<definition>${definition}</definition>

<reference_data>
${json}
</reference_data>

<task>
Using the data above, please write an educational text explaining the Importance and Economic Impact of "${keyword}".
</task>

<requirements>
- Length: Greater than 1000 characters and less than 2000 characters.
- Target audience: Learners encountering economic terms for the first time.
- Tone: Friendly and easy to understand.
- Structure: Write in the order of:
  - Explain the impact of ${keyword} on an individual's life (e.g., savings, investment, consumption).
  - Explain the impact on business management and the national economy (e.g., government policy, trade).
  - Conclude by emphasizing why one should know this term.
- Format: Plain text (no markdown needed).
</requirements>

<output_format>
Output only the explanatory text, without additional notes or meta information. Write all content in Korean.
</output_format>
`;
};
