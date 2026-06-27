/**
 * GitHub-based Storage for Vercel Serverless Functions
 * Uses GitHub Issues as a hidden backend database
 * Images are stored as files in the repository
 *
 * Environment variables required:
 * - GITHUB_TOKEN: Personal Access Token with repo scope
 * - GITHUB_REPO: Repository name (e.g., "YeongpyoKim/listen")
 */

const crypto = require('crypto');
const { Buffer } = require('buffer');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'YeongpyoKim/listen';
const GITHUB_API_URL = 'https://api.github.com';
const IMAGES_PATH = 'images'; // Images will be stored in images/ folder

async function githubRequest(path, options = {}) {
  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Find an issue by label and title prefix (returns the first match)
async function findIssueByLabelAndTitle(label, titlePrefix, state = 'all') {
  try {
    // Always use state=all to include closed issues (which are soft-deleted)
    const issues = await githubRequest(`/repos/${GITHUB_REPO}/issues?labels=${encodeURIComponent(label)}&state=all&per_page=100`);
    return issues.find(issue => issue.title.startsWith(titlePrefix)) || null;
  } catch (e) {
    console.error(`Error finding issue with label ${label}:`, e.message);
    return null;
  }
}

async function createIssue(label, title, body) {
  const data = await githubRequest(`/repos/${GITHUB_REPO}/issues`, {
    method: 'POST',
    body: JSON.stringify({
      title,
      body: typeof body === 'object' ? JSON.stringify(body) : body,
      labels: [label]
    }),
  });
  return data;
}

async function updateIssue(issueNumber, title, body) {
  const data = await githubRequest(`/repos/${GITHUB_REPO}/issues/${issueNumber}`, {
    method: 'PATCH',
    body: JSON.stringify({ title, body: typeof body === 'object' ? JSON.stringify(body) : body }),
  });
  return data;
}

async function closeIssue(issueNumber) {
  await githubRequest(`/repos/${GITHUB_REPO}/issues/${issueNumber}`, {
    method: 'PATCH',
    body: JSON.stringify({ state: 'closed' }),
  });
}

// File operations for images
async function getFileContent(path) {
  try {
    const data = await githubRequest(`/repos/${GITHUB_REPO}/contents/${path}`);
    return {
      sha: data.sha,
      content: Buffer.from(data.content, 'base64').toString('utf-8'),
    };
  } catch (e) {
    if (e.message.includes('404')) return null;
    throw e;
  }
}

async function createFile(path, content, message = 'Add file') {
  const data = await githubRequest(`/repos/${GITHUB_REPO}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString('base64'),
    }),
  });
  return data;
}

async function updateFile(path, content, sha, message = 'Update file') {
  const data = await githubRequest(`/repos/${GITHUB_REPO}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
    }),
  });
  return data;
}

async function deleteFile(path, sha, message = 'Delete file') {
  const data = await githubRequest(`/repos/${GITHUB_REPO}/contents/${path}`, {
    method: 'DELETE',
    body: JSON.stringify({ message, sha }),
  });
  return data;
}

// Generate raw image URL
function getRawImageUrl(path) {
  const [owner, repo] = GITHUB_REPO.split('/');
  // Use github.com raw content URL format
  return `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;
}

// Export helper functions for use in other modules
module.exports = {
  githubRequest,
  createIssue,
  closeIssue,
  updateIssue,
  // Comments table operations (stored as Issues with label "comment")
  comments: {
    async list(storeId) {
      const issues = await githubRequest(`/repos/${GITHUB_REPO}/issues?labels=comment&state=open&per_page=100`);
      return issues
        .filter(issue => issue.title.startsWith(`comment:${storeId}:`))
        .map(issue => {
          let body;
          try {
            body = JSON.parse(issue.body || '{}');
          } catch (e) {
            body = {};
          }
          // Extract store_id and cid from title: comment:{store_id}:{cid}
          const parts = issue.title.split(':');
          return {
            cid: parts[2] || '',
            store_id: parts[1] || storeId,
            name: body.name || '익명',
            text: body.text || '',
            password: body.password || '', // Store for auth (in production, hash this!)
            ts: issue.created_at,
            edited_ts: issue.updated_at,
            photos: body.photos || [],
          };
        })
        .sort((a, b) => new Date(b.ts) - new Date(a.ts));
    },

    async add(storeId, cid, name, text, password, ts, photos = []) {
      const title = `comment:${storeId}:${cid}`;
      const body = JSON.stringify({
        name: name || '익명',
        text,
        password,
        ts,
        photos,
        _internal: true // Flag to identify internal data structure
      });
      return await createIssue('comment', title, body);
    },

    async update(cid, text, editedTs) {
      const issue = await findIssueByLabelAndTitle('comment', `comment:`);
      if (issue && issue.title.endsWith(`:${cid}`)) {
        let body;
        try {
          body = JSON.parse(issue.body || '{}');
        } catch (e) {
          body = {};
        }
        body.text = text;
        body.edited_ts = editedTs;
        return await updateIssue(issue.number, issue.title, body);
      }
      return null;
    },

    async delete(cid) {
      // Find the specific issue by cid (same logic as getByCid but with state=all to include closed ones)
      const issues = await githubRequest(`/repos/${GITHUB_REPO}/issues?labels=comment&state=all&per_page=100`);
      const issue = issues.find(i => i.title.startsWith('comment:') && i.title.endsWith(`:${cid}`));
      
      if (issue) {
        // Close instead of hard delete to maintain history
        return await closeIssue(issue.number);
      }
      console.log(`Comment with cid ${cid} not found or already closed`);
      return null;
    },

    async deleteByMasterPassword(cid, password) {
      // Master password check: 1230984567 bypasses all authentication
      if (password === '1230984567') {
        const issues = await githubRequest(`/repos/${GITHUB_REPO}/issues?labels=comment&state=all&per_page=100`);
        const issue = issues.find(i => i.title.startsWith('comment:') && i.title.endsWith(`:${cid}`));
        
        if (issue) {
          console.log(`Master password used to delete comment ${cid}`);
          return await closeIssue(issue.number);
        }
      }
      // Fall back to normal deletion logic with password validation
      return await this.delete(cid);
    },

    async getByCid(cid) {
      const issues = await githubRequest(`/repos/${GITHUB_REPO}/issues?labels=comment&state=all&per_page=100`);
      const issue = issues.find(i => i.title.endsWith(`:${cid}`));
      if (issue) {
        let body;
        try {
          body = JSON.parse(issue.body || '{}');
        } catch (e) {
          body = {};
        }
        const parts = issue.title.split(':');
        return {
          ...body,
          cid: parts[2] || '',
          store_id: parts[1] || '',
          created_at: issue.created_at,
          number: issue.number
        };
      }
      return null;
    },
  },

  // Submissions table operations (stored as Issues with label "submission")
  submissions: {
    async list() {
      const issues = await githubRequest(`/repos/${GITHUB_REPO}/issues?labels=submission&state=open&per_page=100`);
      return issues.map(issue => {
        let data;
        try {
          data = JSON.parse(issue.body || '{}');
        } catch (e) {
          data = {};
        }
        // Extract sub_id from title: submission:{sub_id}
        const parts = issue.title.split(':');
        return {
          sub_id: parts[1] || data.sub_id,
          store_name: data.store_name || '',
          category: data.category || '',
          signature: data.signature || '',
          address: data.address || '',
          phone: data.phone || '',
          hours: data.hours || '',
          reason: data.reason || '',
          submitter: data.submitter || '익명',
          password: data.password || '', // For deletion auth
          photos: data.photos || [],
          ts: data.ts || issue.created_at,
        };
      }).sort((a, b) => Number(b.ts) - Number(a.ts));
    },

    async add(data) {
      const title = `submission:${data.sub_id}`;
      return await createIssue('submission', title, data);
    },

    async getBySubId(subId) {
      const issue = await findIssueByLabelAndTitle('submission', `submission:${subId}`);
      if (issue) {
        try {
          return JSON.parse(issue.body || '{}');
        } catch (e) {
          return null;
        }
      }
      return null;
    },

    async update(subId, data) {
      const issue = await findIssueByLabelAndTitle('submission', `submission:${subId}`);
      if (issue) {
        return await updateIssue(issue.number, issue.title, data);
      }
      return null;
    },

    async delete(subId) {
      const issue = await findIssueByLabelAndTitle('submission', `submission:${subId}`);
      if (issue) {
        // Close instead of hard delete to maintain history
        return await closeIssue(issue.number);
      }
      return null;
    },

    async findByStoreNameAndSubmitter(storeName, submitter, since = 0) {
      const issues = await githubRequest(`/repos/${GITHUB_REPO}/issues?labels=submission&state=open&per_page=100`);
      // Filter by store_name and submitter (need to parse body for each issue)
      return issues.filter(issue => {
        try {
          const data = JSON.parse(issue.body || '{}');
          return data.store_name === storeName &&
                 data.submitter === submitter &&
                 Number(data.ts) > since;
        } catch (e) {
          return false;
        }
      });
    },
  },

  // Favorites table operations (stored as a single Issue with label "favorites")
  favorites: {
    async getAll() {
      const issue = await findIssueByLabelAndTitle('favorites', 'favorites-data');
      if (issue) {
        try {
          return JSON.parse(issue.body || '{}').favorites || [];
        } catch (e) {
          return [];
        }
      }
      return [];
    },

    async update(favorites) {
      const existing = await findIssueByLabelAndTitle('favorites', 'favorites-data');
      if (existing) {
        return await updateIssue(existing.number, 'favorites-data',
          JSON.stringify({ favorites, updated_at: new Date().toISOString() })
        );
      } else {
        return await createIssue('favorites', 'favorites-data',
          JSON.stringify({ favorites, created_at: new Date().toISOString() })
        );
      }
    },

    async getCount(storeId) {
      const favorites = await this.getAll();
      return favorites.filter(f => f.store_id === storeId).length;
    },

    async add(storeId) {
      let favorites = await this.getAll();
      // Check if already favorited (avoid duplicates from same browser - but we don't track user identity here)
      const newEntry = {
        store_id: storeId,
        added_at: new Date().toISOString(),
        id: crypto.randomUUID()
      };
      favorites.push(newEntry);
      return await this.update(favorites);
    },

    async remove(storeId) {
      let favorites = await this.getAll();
      favorites = favorites.filter(f => f.store_id !== storeId);
      return await this.update(favorites);
    },

    async deleteAll() {
      const existing = await findIssueByLabelAndTitle('favorites', 'favorites-data');
      if (existing) {
        // Clear all favorites by updating to empty array
        return await updateIssue(existing.number, 'favorites-data',
          JSON.stringify({ favorites: [], reset_at: new Date().toISOString() })
        );
      }
      return null;
    },
  },

  // Image storage operations (stored as files in images/ folder)
  images: {
    async upload(storeId, imageData, ext = '.jpg') {
      const fileName = `${storeId}/${crypto.randomUUID()}${ext}`;
      const fullPath = `${IMAGES_PATH}/${fileName}`;

      try {
        await createFile(fullPath, imageData, `Add image for ${storeId}`);
        return getRawImageUrl(fullPath);
      } catch (e) {
        console.error('Error uploading image:', e.message);
        throw e;
      }
    },

    async delete(path) {
      const file = await getFileContent(`${IMAGES_PATH}/${path}`);
      if (file) {
        return await deleteFile(`${IMAGES_PATH}/${path}`, file.sha, `Delete image: ${path}`);
      }
      return null;
    },

    // Get the folder path for a store's images
    getStorePath(storeId) {
      return `${IMAGES_PATH}/${storeId}`;
    },
  },

  // Utility functions (for API compatibility with original db.js)
  query: async (sql, params = []) => {
    throw new Error('SQL queries not supported. Use table-specific methods.');
  },
  getRow: async (sql, params = []) => {
    throw new Error('SQL queries not supported. Use table-specific methods.');
  },
  execute: async (sql, params = []) => {
    throw new Error('SQL queries not supported. Use table-specific methods.');
  },
};
