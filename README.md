# Janitor: A Privacy-Preserving Extension for Anonymizing LLM Prompts  

**Janitor** is a browser extension designed to safeguard your privacy while interacting with large language models (LLMs) like ChatGPT, Claude, or Bard. It ensures that no Personally Identifiable Information (PII) is exposed by running lightweight machine learning models directly in your browser to detect and anonymize sensitive information before sending your prompts.  

---

## **Key Features**
- **Local Processing**: All operations happen locally in your browser, ensuring that no sensitive data is sent to external servers.
- **PII Detection and Replacement**:
  - Uses a fine-tuned BERT model for detecting PII such as names, phone numbers, or addresses.
  - Replaces PII with anonymized equivalents using a small, efficient language model.
- **Lightweight and Seamless**: Powered by `Transformers.js` for in-browser execution, ensuring minimal impact on system performance.
- **Ease of Use**: A simple, one-click anonymization process integrated directly into your browsing experience.

---

## **How It Works**
1. **Detection**: When you type a prompt into a supported LLM interface, Janitor uses a fine-tuned BERT model to scan your input for PII.
2. **Replacement**: Detected PII is replaced with anonymized, contextually equivalent placeholders using a small language model.
3. **Submission**: The sanitized prompt is then sent to the LLM, ensuring your privacy is preserved.

---

## **Models**
1. **PII Detection**:
   - **Model**: A fine-tuned BERT model for Named Entity Recognition (NER).
   - **Task**: Detects entities such as names, dates, locations, and other PII.
   - **Framework**: Runs efficiently in the browser using `Transformers.js`.

2. **PII Replacement**:
   - **Model**: A small-sized language model (e.g., SmolLM, Qwen, Phi-3, or Llama 3.2).
   - **Task**: Generates anonymized replacements for detected PII while preserving the original context.
   - **Framework**: Also powered by `Transformers.js`.

---

## **Installation**
Janitor will be available as a browser extension for Chrome, Firefox, and Edge. Stay tuned for installation instructions and links.

---

## **License**
Janitor is open-source and licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute it within the terms of the license.

---

## **Acknowledgments**
- [Transformers.js](https://github.com/huggingface/transformers.js) for enabling in-browser model execution.
- The AI research community for providing tools, datasets, and models to make privacy-preserving AI possible.

