/**
 * API Functions Test Script
 * Tests all critical API endpoints to ensure they're working correctly
 * 
 * Usage: deno run --allow-net --allow-env test-api-functions.ts
 */

// Test configuration
const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL') || Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('VITE_SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
const TEST_AUTH_TOKEN = Deno.env.get('TEST_AUTH_TOKEN'); // User must provide their test token

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
  blue: '\x1b[34m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printResult(result: TestResult) {
  const symbol = result.status === 'pass' ? '✓' : result.status === 'fail' ? '✗' : '○';
  const color = result.status === 'pass' ? 'green' : result.status === 'fail' ? 'red' : 'yellow';
  log(`${symbol} ${result.name}: ${result.message}${result.duration ? ` (${result.duration}ms)` : ''}`, color);
}

async function testFunction(name: string, path: string, body: any = {}): Promise<TestResult> {
  const startTime = Date.now();
  
  if (!TEST_AUTH_TOKEN) {
    return {
      name,
      status: 'skip',
      message: 'Skipped - No auth token provided (set TEST_AUTH_TOKEN env var)',
    };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_AUTH_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    const duration = Date.now() - startTime;
    const data = await response.json();

    if (response.ok) {
      return {
        name,
        status: 'pass',
        message: 'Success',
        duration,
      };
    } else {
      return {
        name,
        status: 'fail',
        message: `Failed: ${data.error || response.statusText}`,
        duration,
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name,
      status: 'fail',
      message: `Error: ${error.message}`,
      duration,
    };
  }
}

async function testGeminiAPI(): Promise<TestResult> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  
  if (!GEMINI_API_KEY) {
    return {
      name: 'Gemini API Direct Test',
      status: 'skip',
      message: 'Skipped - No GEMINI_API_KEY provided',
    };
  }

  const startTime = Date.now();

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Say "API working" if you can read this.' }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 100,
          }
        })
      }
    );

    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        name: 'Gemini API Direct Test',
        status: 'fail',
        message: `Failed: ${response.status} - ${errorText.substring(0, 100)}`,
        duration,
      };
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (responseText) {
      return {
        name: 'Gemini API Direct Test',
        status: 'pass',
        message: `Success - Response received: "${responseText.substring(0, 50)}..."`,
        duration,
      };
    } else {
      return {
        name: 'Gemini API Direct Test',
        status: 'fail',
        message: 'No response text received from Gemini',
        duration,
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name: 'Gemini API Direct Test',
      status: 'fail',
      message: `Error: ${error.message}`,
      duration,
    };
  }
}

async function testPlaidConfiguration(): Promise<TestResult> {
  const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
  const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
  const PLAID_ENV = Deno.env.get('PLAID_ENV') || 'sandbox';

  if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
    return {
      name: 'Plaid Configuration Test',
      status: 'skip',
      message: 'Skipped - Missing PLAID_CLIENT_ID or PLAID_SECRET',
    };
  }

  const startTime = Date.now();
  const plaidBaseUrl = PLAID_ENV === 'production' 
    ? 'https://production.plaid.com'
    : PLAID_ENV === 'development'
    ? 'https://development.plaid.com'
    : 'https://sandbox.plaid.com';

  try {
    // Test with a simple API call that doesn't require tokens
    const response = await fetch(`${plaidBaseUrl}/institutions/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        count: 1,
        offset: 0,
        country_codes: ['US']
      })
    });

    const duration = Date.now() - startTime;
    
    if (response.ok) {
      return {
        name: 'Plaid Configuration Test',
        status: 'pass',
        message: `Success - Connected to ${PLAID_ENV} environment`,
        duration,
      };
    } else {
      const errorData = await response.json();
      return {
        name: 'Plaid Configuration Test',
        status: 'fail',
        message: `Failed: ${errorData.error_message || response.statusText}`,
        duration,
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name: 'Plaid Configuration Test',
      status: 'fail',
      message: `Error: ${error.message}`,
      duration,
    };
  }
}

// Main test execution
async function runTests() {
  log('\n🧪 PocketTeller API Functions Test Suite', 'blue');
  log('==========================================\n', 'blue');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    log('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables', 'red');
    log('Please set these variables before running tests.\n', 'red');
    Deno.exit(1);
  }

  log(`Supabase URL: ${SUPABASE_URL}`, 'blue');
  log(`Auth Token: ${TEST_AUTH_TOKEN ? 'Provided' : 'Not provided (some tests will be skipped)'}`, 'blue');
  log('\n');

  // Configuration Tests
  log('Configuration Tests:', 'blue');
  log('-------------------', 'blue');
  
  results.push(await testGeminiAPI());
  printResult(results[results.length - 1]);
  
  results.push(await testPlaidConfiguration());
  printResult(results[results.length - 1]);
  
  log('\n');

  // Edge Function Tests (require auth)
  log('Edge Function Tests:', 'blue');
  log('-------------------', 'blue');

  results.push(await testFunction(
    'Gemini Chat Function',
    'gemini-chat',
    { 
      message: 'Hello, this is a test message. Respond with "Test successful".',
      conversation_history: [],
      thread_id: 'test-thread',
      coach_mode: false,
    }
  ));
  printResult(results[results.length - 1]);

  results.push(await testFunction(
    'AI Categorize Transactions',
    'ai-categorize-transactions',
    { limit: 5, threshold: 0.5 }
  ));
  printResult(results[results.length - 1]);

  results.push(await testFunction(
    'AI Spending Insights',
    'ai-spending-insights',
    { months: 1 }
  ));
  printResult(results[results.length - 1]);

  // Note: Plaid functions require valid tokens, so we skip detailed testing
  log('\nℹ️  Plaid functions (plaid-sync, plaid-link-exchange) require valid bank connection', 'yellow');
  log('   and are not tested in this automated suite.\n', 'yellow');

  // Summary
  log('\n==========================================', 'blue');
  log('Test Summary:', 'blue');
  log('==========================================\n', 'blue');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const skipped = results.filter(r => r.status === 'skip').length;

  log(`✓ Passed:  ${passed}`, 'green');
  log(`✗ Failed:  ${failed}`, 'red');
  log(`○ Skipped: ${skipped}`, 'yellow');
  log(`\nTotal: ${results.length} tests\n`, 'blue');

  if (failed > 0) {
    log('Some tests failed. Please check the errors above.', 'red');
    Deno.exit(1);
  } else if (passed === 0 && skipped > 0) {
    log('All tests were skipped. Set TEST_AUTH_TOKEN to run authenticated tests.', 'yellow');
    log('Get a test token by signing in to your app and extracting the JWT from localStorage.', 'yellow');
    Deno.exit(0);
  } else {
    log('All tests passed! 🎉', 'green');
    Deno.exit(0);
  }
}

// Run the tests
runTests();

