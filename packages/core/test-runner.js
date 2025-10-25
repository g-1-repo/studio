#!/usr/bin/env node

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocket, WebSocketServer } from 'ws'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class TestDashboardServer {
  constructor() {
    this.port = 3001
    this.wsPort = 3002
    this.testResults = {
      stats: {
        total: 0,
        passed: 0,
        failed: 0,
        duration: 0,
        coverage: 0,
      },
      categories: {},
      output: [],
    }
    this.clients = new Set()
  }

  async start() {
    await this.startWebSocketServer()
    await this.startHttpServer()
    console.log(`🚀 Test Dashboard Server running at http://localhost:${this.port}`)
    console.log(`📡 WebSocket server running on port ${this.wsPort}`)
  }

  startWebSocketServer() {
    return new Promise(resolve => {
      this.wss = new WebSocketServer({ port: this.wsPort })

      this.wss.on('connection', ws => {
        console.log('📱 Dashboard client connected')
        this.clients.add(ws)

        // Send current test results
        ws.send(
          JSON.stringify({
            type: 'initial_data',
            data: this.testResults,
          })
        )

        ws.on('close', () => {
          console.log('📱 Dashboard client disconnected')
          this.clients.delete(ws)
        })

        ws.on('message', message => {
          try {
            const data = JSON.parse(message)
            this.handleClientMessage(data)
          } catch (error) {
            console.error('❌ Error parsing client message:', error)
          }
        })
      })

      resolve()
    })
  }

  startHttpServer() {
    return new Promise(resolve => {
      const server = http.createServer((req, res) => {
        if (req.url === '/') {
          this.serveDashboard(res)
        } else if (req.url === '/api/test-results') {
          this.serveTestResults(res)
        } else {
          res.writeHead(404)
          res.end('Not Found')
        }
      })

      server.listen(this.port, resolve)
    })
  }

  serveDashboard(res) {
    const dashboardPath = path.join(__dirname, 'test-dashboard.html')

    if (!fs.existsSync(dashboardPath)) {
      res.writeHead(404)
      res.end('Dashboard not found')
      return
    }

    let html = fs.readFileSync(dashboardPath, 'utf8')

    // Inject WebSocket connection code
    const wsScript = `
            <script>
                // WebSocket connection for real-time updates
                const ws = new WebSocket('ws://localhost:${this.wsPort}');
                
                ws.onopen = function() {
                    console.log('🔗 Connected to test dashboard server');
                };
                
                ws.onmessage = function(event) {
                    const message = JSON.parse(event.data);
                    handleServerMessage(message);
                };
                
                ws.onerror = function(error) {
                    console.error('❌ WebSocket error:', error);
                };
                
                function handleServerMessage(message) {
                    switch(message.type) {
                        case 'test_update':
                            updateTestStats(message.data);
                            break;
                        case 'test_output':
                            addTerminalLine(message.data.text, message.data.type);
                            break;
                        case 'test_complete':
                            handleTestComplete(message.data);
                            break;
                        case 'coverage_update':
                            updateCoverageDisplay(message.data);
                            break;
                    }
                }
                
                function updateTestStats(stats) {
                    document.getElementById('totalTests').textContent = stats.total;
                    document.getElementById('passedTests').textContent = stats.passed;
                    document.getElementById('failedTests').textContent = stats.failed;
                    document.getElementById('duration').textContent = stats.duration + 's';
                    
                    const successRate = stats.total > 0 ? (stats.passed / stats.total * 100) : 0;
                    document.querySelector('.progress-fill').style.width = successRate + '%';
                }

                function updateCoverageDisplay(coverage) {
                    const coverageSection = document.getElementById('coverageSection');
                    const noCoverageMessage = document.getElementById('noCoverageMessage');
                    
                    if (coverage && coverage.overall) {
                        // Show coverage section and hide no coverage message
                        coverageSection.style.display = 'block';
                        noCoverageMessage.style.display = 'none';
                        
                        // Update coverage stats
                        document.getElementById('coverageFunctions').textContent = coverage.overall.functions.toFixed(1) + '%';
                        document.getElementById('coverageLines').textContent = coverage.overall.lines.toFixed(1) + '%';
                        document.getElementById('coverageBranches').textContent = coverage.overall.branches.toFixed(1) + '%';
                        document.getElementById('coverageStatements').textContent = coverage.overall.statements.toFixed(1) + '%';
                        
                        // Update progress bar
                        const coverageProgress = document.getElementById('coverageProgress');
                        coverageProgress.style.width = coverage.overall.lines.toFixed(1) + '%';
                        
                        // Update coverage files list
                        const coverageFiles = document.getElementById('coverageFiles');
                        if (coverage.files && coverage.files.length > 0) {
                            let filesHtml = '<div style="font-weight: bold; margin-bottom: 8px;">File Coverage:</div>';
                            coverage.files.forEach(file => {
                                const color = file.lines >= 80 ? '#68d391' : file.lines >= 60 ? '#f6e05e' : '#fc8181';
                                filesHtml += \`<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                    <span style="color: #e2e8f0;">\${file.name}</span>
                                    <span style="color: \${color};">\${file.lines.toFixed(1)}%</span>
                                </div>\`;
                            });
                            coverageFiles.innerHTML = filesHtml;
                        }
                    } else {
                        // Hide coverage section and show no coverage message
                        coverageSection.style.display = 'none';
                        noCoverageMessage.style.display = 'block';
                    }
                }
                
                // Override the original runTests function to use WebSocket
                function runTests() {
                    ws.send(JSON.stringify({ type: 'run_tests' }));
                }
                
                function runCoverage() {
                    ws.send(JSON.stringify({ type: 'run_coverage' }));
                }
                
                function watchMode() {
                    ws.send(JSON.stringify({ type: 'watch_mode' }));
                }
            </script>
        `

    html = html.replace('</body>', `${wsScript}</body>`)

    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
  }

  serveTestResults(res) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(this.testResults))
  }

  handleClientMessage(message) {
    switch (message.type) {
      case 'run_tests':
        this.runTests()
        break
      case 'run_coverage':
        this.runTests(true)
        break
      case 'watch_mode':
        this.startWatchMode()
        break
    }
  }

  broadcast(message) {
    const data = JSON.stringify(message)
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    })
  }

  runTests(withCoverage = false) {
    console.log('🧪 Running tests...')

    this.broadcast({
      type: 'test_output',
      data: { text: '🚀 Starting test run...', type: 'info' },
    })

    const args = ['test']
    if (withCoverage) {
      args.push('--coverage')
    }

    const testProcess = spawn('bun', args, {
      cwd: process.cwd(),
      stdio: 'pipe',
    })

    let output = ''

    testProcess.stdout.on('data', data => {
      const text = data.toString()
      output += text

      // Parse and broadcast test output
      const lines = text.split('\n').filter(line => line.trim())
      lines.forEach(line => {
        this.broadcast({
          type: 'test_output',
          data: { text: line, type: this.getLineType(line) },
        })
      })
    })

    testProcess.stderr.on('data', data => {
      const text = data.toString()
      this.broadcast({
        type: 'test_output',
        data: { text, type: 'error' },
      })
    })

    testProcess.on('close', code => {
      console.log(`✅ Test process exited with code ${code}`)

      // Parse test results
      const results = this.parseTestOutput(output)
      this.testResults = { ...this.testResults, ...results }

      this.broadcast({
        type: 'test_complete',
        data: {
          code,
          results: this.testResults,
          success: code === 0,
        },
      })

      this.broadcast({
        type: 'test_update',
        data: this.testResults.stats,
      })

      // If coverage data is available, broadcast it
      if (withCoverage && results.coverage) {
        this.broadcast({
          type: 'coverage_update',
          data: results.coverage,
        })
      }
    })
  }

  parseTestOutput(output) {
    const results = {
      stats: {
        total: 0,
        passed: 0,
        failed: 0,
        duration: 0,
        coverage: 0,
      },
      coverage: null,
    }

    // Parse test statistics from Vitest output
    const testMatch = output.match(/Test Files\s+(\d+)\s+passed/)
    const passedMatch = output.match(/Tests\s+(\d+)\s+passed/)
    const durationMatch = output.match(/Time\s+([\d.]+)s/)

    if (testMatch) {
      results.stats.total = Number.parseInt(testMatch[1], 10)
      results.stats.passed = Number.parseInt(testMatch[1], 10)
    }

    if (passedMatch) {
      results.stats.total = Number.parseInt(passedMatch[1], 10)
      results.stats.passed = Number.parseInt(passedMatch[1], 10)
    }

    if (durationMatch) {
      results.stats.duration = Number.parseFloat(durationMatch[1])
    }

    // Parse coverage data if present
    const coverageTableMatch = output.match(
      /(-{30,}.*?\n.*?File.*?% Funcs.*?% Lines.*?\n-{30,}.*?\n)(.*?)(-{30,})/s
    )
    if (coverageTableMatch) {
      const coverageData = this.parseCoverageTable(coverageTableMatch[2])
      results.coverage = coverageData

      // Update overall coverage percentage in stats
      if (coverageData?.overall) {
        results.stats.coverage = coverageData.overall.lines
      }
    } else {
      // Try alternative parsing for different output formats
      const altCoverageMatch = output.match(
        /File\s+\|\s+% Funcs\s+\|\s+% Lines\s+\|\s+Uncovered Line #s\s*\n-+\|\s*-+\|\s*-+\|\s*-+\s*\n(.*?)(?:\n\s*\d+\s+pass|\n\s*$)/s
      )
      if (altCoverageMatch) {
        const coverageData = this.parseCoverageTable(altCoverageMatch[1])
        results.coverage = coverageData

        // Update overall coverage percentage in stats
        if (coverageData?.overall) {
          results.stats.coverage = coverageData.overall.lines
        }
      }
    }

    return results
  }

  parseCoverageTable(tableContent) {
    const lines = tableContent.trim().split('\n')
    const files = []
    let overall = null

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine || trimmedLine.startsWith('-')) continue

      // Parse coverage line: "File | % Funcs | % Lines | Uncovered Line #s"
      const parts = trimmedLine.split('|').map(part => part.trim())
      if (parts.length >= 3) {
        const fileName = parts[0]
        const funcsCoverage = parseFloat(parts[1]) || 0
        const linesCoverage = parseFloat(parts[2]) || 0

        if (fileName === 'All files') {
          overall = {
            functions: funcsCoverage,
            lines: linesCoverage,
            branches: 0, // Not provided in current output
            statements: 0, // Not provided in current output
          }
        } else if (fileName && !fileName.includes('---')) {
          files.push({
            name: fileName,
            functions: funcsCoverage,
            lines: linesCoverage,
            uncoveredLines: parts[3] || '',
          })
        }
      }
    }

    return {
      overall,
      files: files.slice(0, 10), // Limit to top 10 files for display
    }
  }

  getLineType(line) {
    if (line.includes('✓') || line.includes('PASS') || line.includes('passed')) {
      return 'success'
    } else if (line.includes('✗') || line.includes('FAIL') || line.includes('failed')) {
      return 'error'
    } else if (line.includes('RUN') || line.includes('Starting')) {
      return 'info'
    }
    return ''
  }

  startWatchMode() {
    console.log('👀 Starting watch mode...')

    this.broadcast({
      type: 'test_output',
      data: { text: '👀 Entering watch mode...', type: 'info' },
    })

    // Use Vitest watch mode
    const watchProcess = spawn('bun', ['test', '--watch'], {
      cwd: process.cwd(),
      stdio: 'pipe',
    })

    watchProcess.stdout.on('data', data => {
      const text = data.toString()
      const lines = text.split('\n').filter(line => line.trim())

      lines.forEach(line => {
        this.broadcast({
          type: 'test_output',
          data: { text: line, type: this.getLineType(line) },
        })
      })
    })

    this.watchProcess = watchProcess
  }

  stop() {
    if (this.watchProcess) {
      this.watchProcess.kill()
    }
    if (this.wss) {
      this.wss.close()
    }
    console.log('🛑 Test dashboard server stopped')
  }
}

// CLI interface
const server = new TestDashboardServer()

server.start().catch(error => {
  console.error('❌ Failed to start server:', error)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test dashboard server...')
  server.stop()
  process.exit(0)
})

export default TestDashboardServer
