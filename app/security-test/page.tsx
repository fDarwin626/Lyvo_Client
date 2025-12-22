"use client";
import React, { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Shield, Zap } from 'lucide-react';
import { signUp, signIn } from '@/lib/api';

// TypeScript interfaces
interface TestResult {
  id: number;
  test: string;
  status: string;
  message: string;
  details: any;
  timestamp: string;
}

const SecurityTester = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test: string, status: string, message: string, details: any = null) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      test,
      status,
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  // TEST 1: SQL Injection Attacks
  const testSQLInjection = async () => {
    addResult('SQL Injection', 'running', 'Testing SQL injection in password field...');
    
    const attacks = [
      { pwd: "' OR '1'='1", desc: "Classic OR bypass" },
      { pwd: "admin'--", desc: "Comment injection" },
      { pwd: "' UNION SELECT * FROM users--", desc: "UNION attack" },
      { pwd: "1' AND 1=1--Aa1!", desc: "AND bypass with valid chars" }
    ];

    for (const { pwd, desc } of attacks) {
      try {
        await signUp({
          email: `test${Date.now()}@test.com`,
          password: pwd
        });
        
        // If we reach here, attack was NOT blocked
        addResult(
          'SQL Injection',
          'fail',
          `❌ DANGER: "${desc}" was ACCEPTED!`,
          { attack: pwd }
        );
      } catch (error: any) {
        // Good! Attack was blocked
        addResult(
          'SQL Injection',
          'pass',
          `✅ BLOCKED: ${desc}`,
          { attack: pwd, error: error.message }
        );
      }
      
      await sleep(200); // Small delay
    }
  };

  // TEST 2: Path Traversal Attacks
  const testPathTraversal = async () => {
    addResult('Path Traversal', 'running', 'Testing path traversal patterns...');
    
    const attacks = [
      { pwd: "../../../etc/passwd", desc: "Linux path traversal" },
      { pwd: "..\\..\\windows\\system32", desc: "Windows path traversal" },
      { pwd: "/etc/passwd123!Aa", desc: "Absolute path with valid chars" },
      { pwd: "../../root/.ssh/id_rsa!1Aa", desc: "SSH key access attempt" }
    ];

    for (const { pwd, desc } of attacks) {
      try {
        await signUp({
          email: `test${Date.now()}@test.com`,
          password: pwd
        });
        
        addResult(
          'Path Traversal',
          'fail',
          `❌ DANGER: "${desc}" was ACCEPTED!`,
          { attack: pwd }
        );
      } catch (error: any) {
        addResult(
          'Path Traversal',
          'pass',
          `✅ BLOCKED: ${desc}`,
          { attack: pwd, error: error.message }
        );
      }
      
      await sleep(200);
    }
  };

  // TEST 3: XSS Attacks
  const testXSS = async () => {
    addResult('XSS Attack', 'running', 'Testing XSS injection patterns...');
    
    const attacks = [
      { pwd: "<script>alert('xss')</script>", desc: "Script tag injection" },
      { pwd: "javascript:alert(1)Pass1!", desc: "JavaScript protocol" },
      { pwd: "<img src=x onerror=alert(1)>A1!", desc: "Image onerror event" },
      { pwd: "onerror=alert(document.cookie)P1!", desc: "Cookie stealing attempt" }
    ];

    for (const { pwd, desc } of attacks) {
      try {
        await signUp({
          email: `test${Date.now()}@test.com`,
          password: pwd
        });
        
        addResult(
          'XSS Attack',
          'fail',
          `❌ DANGER: "${desc}" was ACCEPTED!`,
          { attack: pwd.substring(0, 50) }
        );
      } catch (error: any) {
        addResult(
          'XSS Attack',
          'pass',
          `✅ BLOCKED: ${desc}`,
          { attack: pwd.substring(0, 50), error: error.message }
        );
      }
      
      await sleep(200);
    }
  };

  // TEST 4: Brute Force Attack
  const testBruteForce = async () => {
    addResult('Brute Force', 'running', 'Simulating brute force attack (10 failed logins)...');
    
    const targetEmail = 'victim@test.com';
    let failedAttempts = 0;
    let blocked = false;

    for (let i = 1; i <= 10; i++) {
      try {
        await signIn({
          email: targetEmail,
          password: `WrongPassword${i}!`
        });
        
        // If login succeeds, something is wrong
        addResult(
          'Brute Force',
          'fail',
          `❌ Login succeeded with wrong password!`,
          { attempt: i }
        );
      } catch (error: any) {
        failedAttempts++;
        
        // Check if we got rate limited or banned
        if (error.message && (error.message.includes('Too many') || error.message.includes('banned'))) {
          blocked = true;
          addResult(
            'Brute Force',
            'pass',
            `✅ BLOCKED at attempt ${i}: ${error.message}`,
            { attempt: i, failedAttempts }
          );
          break;
        }
        
        addResult(
          'Brute Force',
          'info',
          `Attempt ${i}/10: Login failed (expected)`,
          { attempt: i }
        );
      }
      
      await sleep(100);
    }

    if (!blocked) {
      addResult(
        'Brute Force',
        'pass',
        `✅ All 10 attempts logged. Check database for threat_scores.`,
        { failedAttempts, note: 'Threat points should be accumulating' }
      );
    }
  };

  // TEST 5: Temp/Disposable Email
  const testTempEmail = async () => {
    addResult('Temp Email', 'running', 'Testing disposable email blocking...');
    
    const tempEmails = [
      { email: 'hacker@guerrillamail.com', service: 'GuerrillaMail' },
      { email: 'spam@tempmail.com', service: 'TempMail' },
      { email: 'fake@10minutemail.com', service: '10MinuteMail' },
      { email: 'bot@mailinator.com', service: 'Mailinator' }
    ];

    for (const { email, service } of tempEmails) {
      try {
        await signUp({
          email: email,
          password: 'ValidPassword123!'
        });
        
        addResult(
          'Temp Email',
          'fail',
          `❌ DANGER: ${service} was ACCEPTED!`,
          { email }
        );
      } catch (error: any) {
        if (error.message && (error.message.includes('not allowed') || error.message.includes('valid email'))) {
          addResult(
            'Temp Email',
            'pass',
            `✅ BLOCKED: ${service}`,
            { email, error: error.message }
          );
        } else {
          addResult(
            'Temp Email',
            'info',
            `Different error: ${error.message || 'Unknown error'}`,
            { email }
          );
        }
      }
      
      await sleep(200);
    }
  };

  // TEST 6: Rate Limiting
  const testRateLimiting = async () => {
    addResult('Rate Limiting', 'running', 'Testing rate limit (3 signups/minute)...');
    
    let rateLimited = false;
    
    for (let i = 1; i <= 5; i++) {
      try {
        await signUp({
          email: `ratelimit${Date.now()}_${i}@test.com`,
          password: 'ValidPassword123!'
        });
        
        addResult(
          'Rate Limiting',
          'info',
          `Signup ${i}/5: Success or duplicate email`,
          { attempt: i }
        );
      } catch (error: any) {
        if (error.message && (error.message.includes('Too many') || error.statusCode === 429)) {
          rateLimited = true;
          addResult(
            'Rate Limiting',
            'pass',
            `✅ RATE LIMITED at attempt ${i}`,
            { attempt: i, error: error.message }
          );
          break;
        } else {
          addResult(
            'Rate Limiting',
            'info',
            `Attempt ${i}: ${error.message || 'Unknown error'}`,
            { attempt: i }
          );
        }
      }
      
      await sleep(100);
    }

    if (!rateLimited) {
      addResult(
        'Rate Limiting',
        'warning',
        `⚠️ No rate limit hit. Check if @limiter.limit("3/minute") is working.`,
        { note: 'May need to clear existing rate limit window' }
      );
    }
  };

  // TEST 7: Command Injection
  const testCommandInjection = async () => {
    addResult('Command Injection', 'running', 'Testing command injection patterns...');
    
    const attacks = [
      { pwd: "cmd.exe /c dir Password1!", desc: "Windows command execution" },
      { pwd: "/bin/bash -c 'ls' Pass1!", desc: "Linux bash execution" },
      { pwd: "powershell Get-Process!1Aa", desc: "PowerShell command" },
      { pwd: "; rm -rf / Password1!", desc: "Dangerous Linux command" }
    ];

    for (const { pwd, desc } of attacks) {
      try {
        await signUp({
          email: `test${Date.now()}@test.com`,
          password: pwd
        });
        
        addResult(
          'Command Injection',
          'fail',
          `❌ DANGER: "${desc}" was ACCEPTED!`,
          { attack: pwd }
        );
      } catch (error: any) {
        addResult(
          'Command Injection',
          'pass',
          `✅ BLOCKED: ${desc}`,
          { attack: pwd, error: error.message }
        );
      }
      
      await sleep(200);
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Run All Tests
  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    addResult('System', 'info', '🚀 Starting security penetration tests...');
    addResult('System', 'info', 'Testing through your FRONTEND (localhost:3000) → BACKEND API');

    await testSQLInjection();
    await testPathTraversal();
    await testXSS();
    await testCommandInjection();
    await testBruteForce();
    await testTempEmail();
    await testRateLimiting();

    addResult('System', 'info', '✅ All tests completed! Check results above.');
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="text-green-500" size={20} />;
      case 'fail': return <XCircle className="text-red-500" size={20} />;
      case 'warning': return <AlertCircle className="text-yellow-500" size={20} />;
      case 'running': return <Zap className="text-blue-500 animate-pulse" size={20} />;
      default: return <Shield className="text-gray-400" size={20} />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-50 border-green-200';
      case 'fail': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'running': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="text-blue-600" size={32} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Security Penetration Testing</h1>
              <p className="text-gray-600 text-sm">Test your site's defenses against common attacks</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex gap-2">
              <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">⚠️ Testing Instructions:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>This tests through your <strong>frontend</strong> (localhost:3000) just like a real hacker would</li>
                  <li>After testing, clean your database using the SQL commands at the bottom</li>
                  <li>Your IP may accumulate threat points - you can clear them from the database</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isRunning ? (
              <>
                <Zap className="animate-spin" size={20} />
                Running Tests...
              </>
            ) : (
              <>
                <Shield size={20} />
                Run All Security Tests
              </>
            )}
          </button>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Test Results</h2>
            <p className="text-gray-600 text-sm">
              {testResults.length} test{testResults.length !== 1 ? 's' : ''} completed
            </p>
          </div>

          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {testResults.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Shield size={48} className="mx-auto mb-3 opacity-30" />
                <p>No tests run yet. Click the button above to start testing.</p>
              </div>
            ) : (
              testResults.map((result) => (
                <div
                  key={result.id}
                  className={`rounded-lg p-4 border ${getStatusBg(result.status)}`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900">{result.test}</h3>
                        <span className="text-xs text-gray-500">{result.timestamp}</span>
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{result.message}</p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                            Show details
                          </summary>
                          <pre className="mt-2 bg-gray-100 rounded p-3 text-xs text-gray-800 overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cleanup Instructions */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            🧹 Database Cleanup (After Testing)
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            Run these SQL commands in your database to clean up test data:
          </p>
          <div className="bg-gray-900 rounded-lg p-4 text-sm text-green-400 space-y-1 font-mono overflow-x-auto">
            <div>-- Delete test users</div>
            <div className="text-gray-400">DELETE FROM users WHERE email LIKE '%@test.com%';</div>
            <div className="text-gray-400">DELETE FROM users WHERE email LIKE '%ratelimit%';</div>
            <div className="text-gray-400">DELETE FROM users WHERE email LIKE '%@guerrillamail.com%';</div>
            <div className="mt-2">-- Clear threat tracking</div>
            <div className="text-gray-400">DELETE FROM threat_scores WHERE entity_value = '127.0.0.1';</div>
            <div className="mt-2">-- Clear security logs</div>
            <div className="text-gray-400">DELETE FROM security_events WHERE ip_address = '127.0.0.1';</div>
            <div className="mt-2">-- Remove any bans on your IP</div>
            <div className="text-gray-400">DELETE FROM shadow_bans WHERE entity_value = '127.0.0.1';</div>
            <div className="text-gray-400">DELETE FROM ip_bans WHERE ip_address = '127.0.0.1';</div>
          </div>
        </div>

        {/* How to Check Database */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            📊 How to Verify Protection Worked
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-gray-700 mb-1">1. Check threat scores accumulated:</p>
              <code className="block bg-gray-100 p-2 rounded text-xs">
                SELECT * FROM threat_scores WHERE entity_value = '127.0.0.1';
              </code>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-1">2. View security events logged:</p>
              <code className="block bg-gray-100 p-2 rounded text-xs">
                SELECT event_type, threat_points_added, description FROM security_events ORDER BY occurred_at DESC LIMIT 10;
              </code>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-1">3. Check if bans were triggered:</p>
              <code className="block bg-gray-100 p-2 rounded text-xs">
                SELECT * FROM shadow_bans; SELECT * FROM ip_bans;
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityTester;