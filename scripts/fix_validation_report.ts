import fs from 'fs';

let ge = fs.readFileSync('src/app/GraphExplorer.tsx', 'utf8');

// The error is `setValidationReport is not defined`
// We need to pull it out of the destructuring or remove it from the dependency array
ge = ge.replace('setValidationReport(validationReport);', '');
ge = ge.replace('const { setDataset, setDatasetIndex, setPendingFocusNodeId } = useGraphStoreV6();', 'const { setDataset, setDatasetIndex, setPendingFocusNodeId } = useGraphStoreV6();');
ge = ge.replace('}, [setDataset, setDatasetIndex, setValidationReport]);', '}, [setDataset, setDatasetIndex]);');
fs.writeFileSync('src/app/GraphExplorer.tsx', ge);
