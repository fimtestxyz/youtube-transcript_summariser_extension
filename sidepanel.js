// Sidepanel JavaScript for YouTube Transcript Extension

let currentTranscript = '';
let currentVideoTitle = '';
let currentVideoId = '';
let currentSummary = '';
let editingPromptId = null;

// Default prompt templates
const defaultPrompts = [
  {
    id: 'default-concise',
    name: 'Concise Summary',
    template: 'Please provide a concise summary of the following YouTube video transcript. Include the main topics discussed and key takeaways:\n\n{transcript}',
    isDefault: true
  },
  {
    id: 'default-detailed',
    name: 'Detailed Analysis',
    template: 'Create a comprehensive analysis of this video transcript. Include:\n1. Main topics and themes\n2. Key points and arguments\n3. Important details and examples\n4. Conclusions and takeaways\n\nTranscript:\n{transcript}',
    isDefault: true
  },
  {
    id: 'default-bullets',
    name: 'Bullet Points',
    template: 'Summarize the following transcript as a bullet-point list of the main ideas:\n\n{transcript}',
    isDefault: true
  },
  {
    id: 'default-technical',
    name: 'Technical Summary',
    template: 'Extract all technical information, code examples, commands, and configuration details from this transcript. Format as a technical reference:\n\n{transcript}',
    isDefault: true
  },
  {
    id: 'default-meeting',
    name: 'Meeting Notes',
    template: 'Create meeting notes from this transcript with:\n- Attendees/Speakers mentioned\n- Topics discussed\n- Decisions made\n- Action items\n\nTranscript:\n{transcript}',
    isDefault: true
  },
  {
    id: 'default-qa',
    name: 'Q&A Format',
    template: 'Extract questions and answers from this transcript. Format as:\nQ: [question]\nA: [answer]\n\nTranscript:\n{transcript}',
    isDefault: true
  }
];

// Default configuration
const defaultConfig = {
  serverType: 'ollama',
  serverUrl: 'http://localhost:11434',
  apiKey: '',
  modelName: 'llama2',
  promptTemplate: 'Please provide a concise summary of the following YouTube video transcript. Include the main topics discussed and key takeaways:\n\n{transcript}'
};

// Load configuration from storage
function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get('aiConfig', (result) => {
      const config = result.aiConfig || defaultConfig;
      document.getElementById('serverType').value = config.serverType || 'ollama';
      document.getElementById('serverUrl').value = config.serverUrl || 'http://localhost:11434';
      document.getElementById('apiKey').value = config.apiKey || '';
      document.getElementById('modelName').value = config.modelName || 'llama2';
      document.getElementById('promptTemplate').value = config.promptTemplate || defaultConfig.promptTemplate;
      resolve(config);
    });
  });
}

// Save configuration to storage
function saveConfig() {
  const config = {
    serverType: document.getElementById('serverType').value,
    serverUrl: document.getElementById('serverUrl').value,
    apiKey: document.getElementById('apiKey').value,
    modelName: document.getElementById('modelName').value,
    promptTemplate: document.getElementById('promptTemplate').value
  };
  
  chrome.storage.sync.set({ aiConfig: config }, () => {
    showConfigMessage('Settings saved successfully!', 'success');
  });
}

// Load prompts from storage
async function loadPrompts() {
  return new Promise((resolve) => {
    chrome.storage.local.get('customPrompts', (result) => {
      const customPrompts = result.customPrompts || [];
      const allPrompts = [...defaultPrompts, ...customPrompts];
      resolve(allPrompts);
    });
  });
}

// Save prompts to storage
function savePrompts(customPrompts) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ customPrompts }, () => {
      resolve();
    });
  });
}

// Populate prompt dropdown
async function populatePromptDropdown() {
  const prompts = await loadPrompts();
  const select = document.getElementById('promptSelect');
  
  // Clear existing options except first
  select.innerHTML = '<option value="">Select a prompt template...</option>';
  
  prompts.forEach(prompt => {
    const option = document.createElement('option');
    option.value = prompt.id;
    option.textContent = prompt.name + (prompt.isDefault ? ' (Default)' : '');
    option.dataset.template = prompt.template;
    select.appendChild(option);
  });
}

// Show prompt management modal
function showPromptModal() {
  console.log('🟢 Opening prompt modal');
  const modal = document.getElementById('promptModal');
  if (modal) {
    const wasHidden = modal.classList.contains('hidden');
    modal.classList.remove('hidden');
    console.log('  - Was hidden:', wasHidden);
    console.log('  - Classes after:', modal.className);
    renderPromptsList();
  } else {
    console.error('❌ Prompt modal element not found');
  }
}

// Hide prompt management modal  
function hidePromptModal() {
  console.log('🔴 Closing prompt modal');
  const modal = document.getElementById('promptModal');
  const form = document.getElementById('promptForm');
  
  if (modal) {
    const wasHidden = modal.classList.contains('hidden');
    modal.classList.add('hidden');
    console.log('  - Was already hidden:', wasHidden);
    console.log('  - Classes after:', modal.className);
  }
  if (form) {
    form.classList.add('hidden');
  }
  editingPromptId = null;
}

// Render prompts list
async function renderPromptsList() {
  const prompts = await loadPrompts();
  const listEl = document.getElementById('promptsList');
  
  listEl.innerHTML = '';
  
  prompts.forEach(prompt => {
    const item = document.createElement('div');
    item.className = 'prompt-item';
    
    const header = document.createElement('div');
    header.className = 'prompt-item-header';
    
    const name = document.createElement('div');
    name.className = 'prompt-item-name';
    name.textContent = prompt.name;
    if (prompt.isDefault) {
      const badge = document.createElement('span');
      badge.className = 'default-badge';
      badge.textContent = 'Default';
      name.appendChild(badge);
    }
    header.appendChild(name);
    
    const actions = document.createElement('div');
    actions.className = 'prompt-item-actions';
    
    const useBtn = document.createElement('button');
    useBtn.textContent = 'Use';
    useBtn.onclick = () => usePrompt(prompt);
    actions.appendChild(useBtn);
    
    if (!prompt.isDefault) {
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.onclick = () => editPrompt(prompt);
      actions.appendChild(editBtn);
      
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.style.color = '#d32f2f';
      deleteBtn.onclick = () => deletePrompt(prompt.id);
      actions.appendChild(deleteBtn);
    }
    
    header.appendChild(actions);
    item.appendChild(header);
    
    const text = document.createElement('div');
    text.className = 'prompt-item-text';
    text.textContent = prompt.template;
    item.appendChild(text);
    
    listEl.appendChild(item);
  });
}

// Use prompt (apply to textarea)
function usePrompt(prompt) {
  document.getElementById('promptTemplate').value = prompt.template;
  document.getElementById('promptSelect').value = prompt.id;
  hidePromptModal();
  showConfigMessage(`Applied prompt: ${prompt.name}`, 'success');
}

// Show add prompt form
function showAddPromptForm() {
  editingPromptId = null;
  document.getElementById('formTitle').textContent = 'Add New Prompt';
  document.getElementById('promptName').value = '';
  document.getElementById('promptText').value = '';
  document.getElementById('promptForm').classList.remove('hidden');
}

// Edit prompt
function editPrompt(prompt) {
  editingPromptId = prompt.id;
  document.getElementById('formTitle').textContent = 'Edit Prompt';
  document.getElementById('promptName').value = prompt.name;
  document.getElementById('promptText').value = prompt.template;
  document.getElementById('promptForm').classList.remove('hidden');
}

// Save prompt (add or update)
async function savePromptToLibrary() {
  const name = document.getElementById('promptName').value.trim();
  const template = document.getElementById('promptText').value.trim();
  
  if (!name || !template) {
    showConfigMessage('Please fill in both name and template', 'error');
    return;
  }
  
  if (!template.includes('{transcript}')) {
    showConfigMessage('Template must include {transcript} placeholder', 'error');
    return;
  }
  
  const result = await chrome.storage.local.get('customPrompts');
  let customPrompts = result.customPrompts || [];
  
  if (editingPromptId) {
    // Update existing
    const index = customPrompts.findIndex(p => p.id === editingPromptId);
    if (index !== -1) {
      customPrompts[index] = {
        ...customPrompts[index],
        name,
        template
      };
    }
  } else {
    // Add new
    const newPrompt = {
      id: 'custom-' + Date.now(),
      name,
      template,
      isDefault: false
    };
    customPrompts.push(newPrompt);
  }
  
  await savePrompts(customPrompts);
  await populatePromptDropdown();
  await renderPromptsList();
  
  document.getElementById('promptForm').classList.add('hidden');
  showConfigMessage('Prompt saved successfully!', 'success');
}

// Delete prompt
async function deletePrompt(id) {
  if (!confirm('Are you sure you want to delete this prompt?')) {
    return;
  }
  
  const result = await chrome.storage.local.get('customPrompts');
  let customPrompts = result.customPrompts || [];
  
  customPrompts = customPrompts.filter(p => p.id !== id);
  
  await savePrompts(customPrompts);
  await populatePromptDropdown();
  await renderPromptsList();
  
  showConfigMessage('Prompt deleted', 'success');
}

// Cancel prompt editing
function cancelPromptEdit() {
  document.getElementById('promptForm').classList.add('hidden');
  editingPromptId = null;
}

// Export prompts to JSON file
async function exportPrompts() {
  const prompts = await loadPrompts();
  
  const dataStr = JSON.stringify(prompts, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'youtube-transcript-prompts.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showConfigMessage('Prompts exported successfully!', 'success');
}

// Import prompts from JSON file
function importPrompts() {
  const input = document.getElementById('importFileInput');
  input.click();
}

// Handle imported file
async function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const importedPrompts = JSON.parse(text);
    
    if (!Array.isArray(importedPrompts)) {
      throw new Error('Invalid format: Expected array of prompts');
    }
    
    // Validate prompts
    for (const prompt of importedPrompts) {
      if (!prompt.name || !prompt.template) {
        throw new Error('Invalid prompt: Missing name or template');
      }
      if (!prompt.template.includes('{transcript}')) {
        throw new Error(`Prompt "${prompt.name}" missing {transcript} placeholder`);
      }
    }
    
    const result = await chrome.storage.local.get('customPrompts');
    let customPrompts = result.customPrompts || [];
    
    // Add imported prompts (skip defaults, merge customs)
    const newCustoms = importedPrompts
      .filter(p => !p.isDefault)
      .map(p => ({
        id: p.id || 'custom-' + Date.now() + '-' + Math.random(),
        name: p.name,
        template: p.template,
        isDefault: false
      }));
    
    // Merge avoiding duplicates by name
    for (const newPrompt of newCustoms) {
      const existingIndex = customPrompts.findIndex(p => p.name === newPrompt.name);
      if (existingIndex !== -1) {
        // Update existing
        customPrompts[existingIndex] = newPrompt;
      } else {
        // Add new
        customPrompts.push(newPrompt);
      }
    }
    
    await savePrompts(customPrompts);
    await populatePromptDropdown();
    await renderPromptsList();
    
    showConfigMessage(`Imported ${newCustoms.length} prompt(s)!`, 'success');
    
    // Reset file input
    event.target.value = '';
  } catch (error) {
    showConfigMessage(`Import failed: ${error.message}`, 'error');
    console.error('Import error:', error);
  }
}

// Show configuration message
function showConfigMessage(message, type) {
  const msgEl = document.getElementById('configMessage');
  msgEl.textContent = message;
  msgEl.className = type;
  setTimeout(() => {
    msgEl.textContent = '';
    msgEl.className = '';
  }, 3000);
}

// Update connection status indicator
function updateConnectionStatus(status, message) {
  const indicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  
  indicator.className = 'status-indicator';
  
  if (status === 'connected') {
    indicator.textContent = '✓';
    indicator.classList.add('connected');
    statusText.textContent = message || 'Connected to Ollama';
  } else if (status === 'disconnected') {
    indicator.textContent = '✗';
    indicator.classList.add('disconnected');
    statusText.textContent = message || 'Not connected';
  } else if (status === 'checking') {
    indicator.textContent = '⏳';
    indicator.classList.add('checking');
    statusText.textContent = message || 'Checking connection...';
  }
}

// Test connection to Ollama/OpenAI server
async function testConnection() {
  const config = {
    serverType: document.getElementById('serverType').value,
    serverUrl: document.getElementById('serverUrl').value,
    apiKey: document.getElementById('apiKey').value,
    modelName: document.getElementById('modelName').value || 'llama2'
  };
  
  updateConnectionStatus('checking', 'Testing connection...');
  
  try {
    // Test by fetching available models/tags
    const testUrl = config.serverType === 'ollama' 
      ? `${config.serverUrl}/api/tags`
      : `${config.serverUrl}/v1/models`;
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (config.apiKey && config.serverType !== 'ollama') {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }
    
    const response = await fetch(testUrl, { headers });
    
    if (response.ok) {
      const data = await response.json();
      const modelCount = config.serverType === 'ollama' 
        ? (data.models?.length || 0)
        : (data.data?.length || 0);
      
      updateConnectionStatus('connected', `Connected - ${modelCount} model(s) available`);
      showConfigMessage(`✅ Connection successful! Found ${modelCount} model(s).`, 'success');
      return true;
    } else {
      updateConnectionStatus('disconnected', `Error: ${response.status}`);
      showConfigMessage(`❌ Connection failed: ${response.status} ${response.statusText}`, 'error');
      return false;
    }
  } catch (error) {
    updateConnectionStatus('disconnected', 'Connection failed');
    showConfigMessage(`❌ Error: ${error.message}. Make sure server is running.`, 'error');
    return false;
  }
}

// Fetch available models from Ollama
async function fetchModels() {
  const config = {
    serverType: document.getElementById('serverType').value,
    serverUrl: document.getElementById('serverUrl').value,
    apiKey: document.getElementById('apiKey').value
  };
  
  const fetchBtn = document.getElementById('fetchModelsBtn');
  const modelSelect = document.getElementById('modelSelect');
  
  fetchBtn.disabled = true;
  fetchBtn.textContent = '⏳ Fetching...';
  
  try {
    const url = config.serverType === 'ollama'
      ? `${config.serverUrl}/api/tags`
      : `${config.serverUrl}/v1/models`;
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (config.apiKey && config.serverType !== 'ollama') {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Clear existing options except first
    modelSelect.innerHTML = '<option value="">Select a model...</option>';
    
    if (config.serverType === 'ollama') {
      const models = data.models || [];
      if (models.length === 0) {
        showConfigMessage('⚠️ No models found. Run: ollama pull llama2', 'error');
      } else {
        models.forEach(model => {
          const option = document.createElement('option');
          option.value = model.name;
          const sizeGB = (model.size / 1024 / 1024 / 1024).toFixed(2);
          option.textContent = `${model.name} (${sizeGB} GB)`;
          modelSelect.appendChild(option);
        });
        showConfigMessage(`✅ Found ${models.length} model(s)`, 'success');
      }
    } else {
      const models = data.data || [];
      models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.id;
        modelSelect.appendChild(option);
      });
      showConfigMessage(`✅ Found ${models.length} model(s)`, 'success');
    }
    
  } catch (error) {
    showConfigMessage(`❌ Failed to fetch models: ${error.message}`, 'error');
    console.error('Fetch models error:', error);
  } finally {
    fetchBtn.disabled = false;
    fetchBtn.textContent = '🔄 Fetch';
  }
}

// Load transcript from storage
function loadTranscript() {
  chrome.storage.local.get([
    'currentTranscript',
    'currentTranscriptJson',
    'currentVideoTitle',
    'currentVideoId'
  ], (result) => {
    if (result.currentTranscript) {
      currentTranscript = result.currentTranscript;
      currentVideoTitle = result.currentVideoTitle || 'Unknown';
      currentVideoId = result.currentVideoId || '';
      
      document.getElementById('videoTitle').textContent = currentVideoTitle;
      document.getElementById('transcriptBox').textContent = currentTranscript;
      document.getElementById('emptyState').classList.add('hidden');
      document.getElementById('transcriptContainer').classList.remove('hidden');
      
      // Enable buttons
      document.getElementById('downloadBtn').disabled = false;
      document.getElementById('summarizeBtn').disabled = false;
    } else {
      document.getElementById('emptyState').classList.remove('hidden');
      document.getElementById('transcriptContainer').classList.add('hidden');
      document.getElementById('downloadBtn').disabled = true;
      document.getElementById('summarizeBtn').disabled = true;
    }
  });
}

// Download transcript as TXT file
function downloadTranscript() {
  if (!currentTranscript) return;
  
  const blob = new Blob([currentTranscript], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentVideoTitle || 'transcript'}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download summary as TXT file
function downloadSummary() {
  if (!currentSummary) return;
  
  const blob = new Blob([currentSummary], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentVideoTitle || 'transcript'}-summary.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Summarize transcript using AI
async function summarizeTranscript() {
  if (!currentTranscript) {
    showConfigMessage('No transcript available to summarize', 'error');
    return;
  }

  const config = await loadConfig();
  const summaryContainer = document.getElementById('summaryContainer');
  const summaryContent = document.getElementById('summaryContent');
  const summarizeBtn = document.getElementById('summarizeBtn');
  
  // Show loading state
  summarizeBtn.disabled = true;
  summarizeBtn.textContent = 'Summarizing...';
  summaryContainer.classList.remove('hidden');
  summaryContent.innerHTML = '<div class="loading">Generating summary</div>';
  
  try {
    // Prepare prompt
    const prompt = config.promptTemplate.replace('{transcript}', currentTranscript);
    
    let summary = '';
    
    if (config.serverType === 'ollama') {
      // Ollama API format
      summary = await callOllamaAPI(config, prompt);
    } else {
      // OpenAI-compatible API format
      summary = await callOpenAICompatibleAPI(config, prompt);
    }
    
    currentSummary = summary;
    summaryContent.textContent = summary;
    
  } catch (error) {
    summaryContent.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    console.error('Summarization error:', error);
  } finally {
    summarizeBtn.disabled = false;
    summarizeBtn.textContent = 'Summarize';
  }
}

// Call Ollama API
async function callOllamaAPI(config, prompt) {
  console.log('Calling Ollama API with config:', {
    serverUrl: config.serverUrl,
    model: config.modelName
  });
  
  // For Ollama, the native endpoint is /api/chat (not /v1/chat/completions)
  // /v1/chat/completions is for OpenAI compatibility mode
  
  // Try 1: Native Ollama chat endpoint (recommended)
  try {
    const chatUrl = `${config.serverUrl}/api/chat`;
    console.log('Trying Ollama chat endpoint:', chatUrl);
    
    const response = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: false
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Chat endpoint succeeded');
      if (data.message && data.message.content) {
        return data.message.content;
      }
    } else {
      console.log(`Chat endpoint failed: ${response.status}`);
    }
  } catch (e) {
    console.log('Chat endpoint error:', e.message);
  }
  
  // Try 2: Native Ollama generate endpoint (fallback)
  try {
    const generateUrl = `${config.serverUrl}/api/generate`;
    console.log('Trying Ollama generate endpoint:', generateUrl);
    
    const response = await fetch(generateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.modelName,
        prompt: prompt,
        stream: false
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Generate endpoint succeeded');
      return data.response || 'No summary generated';
    } else {
      console.log(`Generate endpoint failed: ${response.status}`);
      const errorText = await response.text().catch(() => response.statusText);
      console.log('Error response:', errorText);
    }
  } catch (e) {
    console.log('Generate endpoint error:', e.message);
  }
  
  // All attempts failed - provide helpful error
  throw new Error(
    `Ollama API failed. Please verify:\n` +
    `1. Ollama is running: Run "ollama serve" in terminal\n` +
    `2. Model is installed: Run "ollama list" to check, then "ollama pull ${config.modelName}"\n` +
    `3. Test the API: Run this command:\n` +
    `   curl ${config.serverUrl}/api/tags\n` +
    `4. Server URL is correct: Should be "http://localhost:11434"\n\n` +
    `Your Ollama version: 0.16.1\n` +
    `Expected endpoints: /api/chat or /api/generate`
  );
}

// Call OpenAI-compatible API
async function callOpenAICompatibleAPI(config, prompt) {
  const url = `${config.serverUrl}/v1/chat/completions`;
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      model: config.modelName,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.choices && data.choices.length > 0 && data.choices[0].message) {
    return data.choices[0].message.content;
  }
  
  throw new Error('Invalid API response format');
}

// Toggle configuration panel
function toggleConfig() {
  const configPanel = document.getElementById('configPanel');
  configPanel.classList.toggle('hidden');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Sidepanel initializing...');
  
  // CRITICAL: Ensure modal starts hidden
  const modal = document.getElementById('promptModal');
  if (modal) {
    // Make absolutely sure it's hidden
    modal.classList.add('hidden');
    const isHidden = modal.classList.contains('hidden');
    const computedDisplay = window.getComputedStyle(modal).display;
    console.log('📋 Modal initialization:');
    console.log('  - Has hidden class:', isHidden);
    console.log('  - Computed display:', computedDisplay);
    console.log('  - Should be "none":', computedDisplay === 'none' ? '✅' : '❌ PROBLEM!');
    
    if (computedDisplay !== 'none') {
      console.error('❌ WARNING: Modal is visible on load! This should not happen.');
      console.error('   Classes:', modal.className);
      console.error('   Inline style:', modal.style.display);
    } else {
      console.log('✅ Modal correctly hidden on load');
    }
  } else {
    console.error('❌ Modal element not found!');
  }
  
  loadConfig();
  loadTranscript();
  populatePromptDropdown();
  
  // Auto-test connection on load
  setTimeout(() => {
    testConnection();
  }, 500);
  
  // Event listeners
  document.getElementById('refreshBtn').addEventListener('click', loadTranscript);
  document.getElementById('downloadBtn').addEventListener('click', downloadTranscript);
  document.getElementById('summarizeBtn').addEventListener('click', summarizeTranscript);
  document.getElementById('downloadSummaryBtn').addEventListener('click', downloadSummary);
  document.getElementById('toggleConfig').addEventListener('click', toggleConfig);
  document.getElementById('saveConfigBtn').addEventListener('click', saveConfig);
  document.getElementById('testConnectionBtn').addEventListener('click', testConnection);
  document.getElementById('fetchModelsBtn').addEventListener('click', fetchModels);
  
  // Prompt management event listeners
  document.getElementById('promptSelect').addEventListener('change', (e) => {
    if (e.target.value) {
      const option = e.target.selectedOptions[0];
      const template = option.dataset.template;
      if (template) {
        document.getElementById('promptTemplate').value = template;
      }
    }
  });
  
  document.getElementById('managePromptsBtn').addEventListener('click', (e) => {
    console.log('Manage button clicked!');
    e.preventDefault();
    e.stopPropagation();
    showPromptModal();
  });
  
  // Close button handler with stopPropagation
  const closeBtn = document.getElementById('closePromptModal');
  if (closeBtn) {
    console.log('Close button found, attaching handler');
    closeBtn.addEventListener('click', (e) => {
      console.log('Close button clicked!');
      e.preventDefault();
      e.stopPropagation();
      hidePromptModal();
      return false;
    });
  } else {
    console.error('Close button not found!');
  }
  
  document.getElementById('addPromptBtn').addEventListener('click', showAddPromptForm);
  document.getElementById('savePromptBtn').addEventListener('click', savePromptToLibrary);
  document.getElementById('cancelPromptBtn').addEventListener('click', cancelPromptEdit);
  document.getElementById('exportPromptsBtn').addEventListener('click', exportPrompts);
  document.getElementById('importPromptsBtn').addEventListener('click', importPrompts);
  document.getElementById('importFileInput').addEventListener('change', handleImportFile);
  
  // Close modal when clicking on backdrop (outside modal content)
  const promptModal = document.getElementById('promptModal');
  if (promptModal) {
    promptModal.addEventListener('click', (e) => {
      if (e.target.id === 'promptModal') {
        hidePromptModal();
      }
    });
  }
  
  // Prevent clicks inside modal content from closing modal
  const modalContent = document.querySelector('.modal-content');
  if (modalContent) {
    modalContent.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  
  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('promptModal');
      if (modal && !modal.classList.contains('hidden')) {
        hidePromptModal();
      }
    }
  });
  
  // Model select change handler
  document.getElementById('modelSelect').addEventListener('change', (e) => {
    if (e.target.value) {
      document.getElementById('modelName').value = e.target.value;
    }
  });
  
  // Listen for storage changes (auto-refresh on new video)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      // Check if transcript or video changed
      if (changes.currentTranscript || changes.currentVideoId) {
        console.log('New transcript detected, auto-refreshing...');
        
        // Clear old summary when switching videos
        if (changes.currentVideoId) {
          currentSummary = '';
          document.getElementById('summaryContainer').classList.add('hidden');
        }
        
        // Load new transcript
        loadTranscript();
        
        // Show a brief notification
        const videoTitle = document.getElementById('videoTitle');
        const originalText = videoTitle.textContent;
        videoTitle.textContent = '🔄 Transcript updated!';
        setTimeout(() => {
          loadTranscript(); // Refresh title
        }, 1000);
      }
    }
  });
  
  // Update server URL when type changes
  document.getElementById('serverType').addEventListener('change', (e) => {
    const serverUrlInput = document.getElementById('serverUrl');
    if (e.target.value === 'ollama') {
      serverUrlInput.value = 'http://localhost:11434';
    } else {
      serverUrlInput.value = 'https://api.openai.com';
    }
  });
});
