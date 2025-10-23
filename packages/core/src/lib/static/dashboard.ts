export const DASHBOARD_HTML = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Dashboard</title>
          <style>
              body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
              .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 20px 0; }
              .header { text-align: center; margin-bottom: 24px; }
              .title { font-size: 2rem; font-weight: bold; margin: 0; }
              .subtitle { color: #6b7280; font-size: 0.875rem; margin: 8px 0 0 0; }
              .content { space-y: 16px; }
              .info-row { margin: 12px 0; }
              .info-row strong { display: inline-block; width: 120px; }
              button { padding: 8px 16px; margin: 8px 4px; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; }
              .primary-btn { background: #3b82f6; color: white; border-color: #3b82f6; }
              .danger-btn { background: #ef4444; color: white; border-color: #ef4444; }
              footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; padding: 16px; font-size: 0.875rem; color: #6b7280; background: white; border-top: 1px solid #e5e7eb; }
              footer a { color: #3b82f6; text-decoration: underline; }
          </style>
      </head>
      <body>
          <div class="card">
              <div class="header">
                  <h1 class="title">Dashboard</h1>
              </div>
              
              <div id="status">Loading...</div>
              
              <div id="not-logged-in" style="display:none;">
                  <button onclick="loginAnonymously()" class="primary-btn">Login Anonymously</button>
              </div>
              
              <div id="logged-in" style="display:none;">
                  <div class="content">
                      <p>Welcome, <span id="user-name" style="font-weight: 600;"></span>!</p>
                      <div id="user-info"></div>
                      <div id="geolocation-info"></div>
                      <div style="margin-top: 24px;">
                          <button onclick="tryProtectedRoute()" class="primary-btn">Try Protected Route</button>
                          <button onclick="logout()">Logout</button>
                      </div>
                  </div>
              </div>
              
              <div id="protected-result"></div>
          </div>
          
          <footer>
              Powered by 
              G1.
          </footer>

          <script>
              let currentUser = null;

              async function checkStatus() {
                  try {
                      const response = await fetch('/api/auth/get-session', {
                          credentials: 'include'
                      });
                      
                      if (!response.ok) {
                          showNotLoggedIn();
                          return;
                      }
                      
                      const text = await response.text();
                      
                      if (!text || text.trim() === '') {
                          showNotLoggedIn();
                          return;
                      }
                      
                      const result = JSON.parse(text);
                      
                      if (result?.session) {
                          currentUser = result.user;
                          await showLoggedIn();
                      } else {
                          showNotLoggedIn();
                      }
                  } catch (error) {
                      console.error('Error checking status:', error);
                      showNotLoggedIn();
                  }
              }

              async function loginAnonymously() {
                  try {
                      // First check if already logged in
                      await checkStatus();
                      if (currentUser) {
                          return;
                      }
                      
                      const response = await fetch('/api/auth/sign-in/anonymous', {
                          method: 'POST',
                          credentials: 'include',
                          headers: {
                              'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({})
                      });
                      
                      const text = await response.text();
                      
                      if (!response.ok) {
                          // Handle specific error for already anonymous
                          if (text.includes('ANONYMOUS_USERS_CANNOT_SIGN_IN_AGAIN_ANONYMOUSLY')) {
                              alert('You are already logged in anonymously!');
                              await checkStatus(); // Refresh status
                              return;
                          }
                          alert('Anonymous login failed: HTTP ' + response.status + ' - ' + text);
                          return;
                      }
                      
                      const result = JSON.parse(text);
                      
                      if (result.user) {
                          currentUser = result.user;
                          await showLoggedIn();
                      } else {
                          alert('Anonymous login failed: ' + (result.error?.message || 'Unknown error'));
                      }
                  } catch (error) {
                      console.error('Anonymous login error:', error);
                      alert('Anonymous login failed: ' + error.message);
                  }
              }

              async function logout() {
                  try {
                      await fetch('/api/auth/sign-out', {
                          method: 'POST',
                          credentials: 'include',
                          headers: {
                              'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({})
                      });
                      currentUser = null;
                      showNotLoggedIn();
                      document.getElementById('protected-result').innerHTML = '';
                  } catch (error) {
                      alert('Logout failed: ' + error.message);
                  }
              }

              async function clearSession() {
                  try {
                      // Clear cookies by setting them to expire
                      document.cookie.split(";").forEach(function(c) { 
                          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                      });
                      
                      // Force logout
                      await logout();
                      
                      // Refresh page to clear any cached state
                      window.location.reload();
                  } catch (error) {
                      console.error('Error clearing session:', error);
                      window.location.reload();
                  }
              }

              async function tryProtectedRoute() {
                  try {
                      const response = await fetch('/protected', {
                          credentials: 'include'
                      });
                      const text = await response.text();
                      
                      document.getElementById('protected-result').innerHTML = 
                          '<h3>Protected Route Result:</h3><div style="border:1px solid #ccc; padding:10px; margin:10px 0;">' + text + '</div>';
                  } catch (error) {
                      document.getElementById('protected-result').innerHTML = 
                          '<h3>Protected Route Error:</h3><div style="border:1px solid red; padding:10px; margin:10px 0;">' + error.message + '</div>';
                  }
              }

              async function showLoggedIn() {
                  document.getElementById('status').innerHTML = 'Status: Logged In';
                  document.getElementById('not-logged-in').style.display = 'none';
                  document.getElementById('logged-in').style.display = 'block';
                  
                  if (currentUser) {
                      document.getElementById('user-name').textContent = currentUser.name || currentUser.email || 'User';
                      
                      document.getElementById('user-info').innerHTML = 
                          '<div class="info-row"><strong>Email:</strong> ' + (currentUser.email || 'Anonymous') + '</div>' +
                          '<div class="info-row"><strong>User ID:</strong> ' + currentUser.id + '</div>';
                      
                      // Fetch geolocation data
                      try {
                          const geoResponse = await fetch('/api/auth/cloudflare/geolocation', {
                              credentials: 'include'
                          });
                          
                          if (geoResponse.ok) {
                              const geoData = await geoResponse.json();
                              document.getElementById('geolocation-info').innerHTML = 
                                  '<div class="info-row"><strong>Timezone:</strong> ' + (geoData.timezone || 'Unknown') + '</div>' +
                                  '<div class="info-row"><strong>City:</strong> ' + (geoData.city || 'Unknown') + '</div>' +
                                  '<div class="info-row"><strong>Country:</strong> ' + (geoData.country || 'Unknown') + '</div>' +
                                  '<div class="info-row"><strong>Region:</strong> ' + (geoData.region || 'Unknown') + '</div>' +
                                  '<div class="info-row"><strong>Region Code:</strong> ' + (geoData.regionCode || 'Unknown') + '</div>' +
                                  '<div class="info-row"><strong>Data Center:</strong> ' + (geoData.colo || 'Unknown') + '</div>' +
                                  (geoData.latitude ? '<div class="info-row"><strong>Latitude:</strong> ' + geoData.latitude + '</div>' : '') +
                                  (geoData.longitude ? '<div class="info-row"><strong>Longitude:</strong> ' + geoData.longitude + '</div>' : '');
                          } else {
                              document.getElementById('geolocation-info').innerHTML = '<div class="info-row"><strong>Geolocation:</strong> Unable to fetch</div>';
                          }
                      } catch (error) {
                          document.getElementById('geolocation-info').innerHTML = '<div class="info-row"><strong>Geolocation:</strong> Error fetching data</div>';
                      }
                  }
              }

              function showNotLoggedIn() {
                  document.getElementById('status').innerHTML = 'Status: Not Logged In';
                  document.getElementById('not-logged-in').style.display = 'block';
                  document.getElementById('logged-in').style.display = 'none';
              }

              // Check status on page load
              checkStatus();
          </script>
      </body>
      </html>
`
