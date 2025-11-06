export const createExamplePrompts = (
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
Using the data above, please write an educational text explaining the real-life examples and analogies of "${keyword}".
</task>

<requirements>
- Length: Greater than 1000 characters and less than 2000 characters.
- Target audience: Learners encountering economic terms for the first time.
- Tone: Formal style.
- Prohibition : Since the concept of the keyword has already been written in another article, do not explain the concept of the keyword here.
- Structure: Write in the order of specific real-life examples that learners can relate to in everyday life for the term → an appropriate analogy to aid understanding → example sentences of how the term is used in news articles or media..
- Format: News article format(no markdown needed).
</requirements>

<output_format>
Output only the explanatory text, without additional notes or meta information. Write all content in Korean.
</output_format>
`;
};
