import { Octokit } from 'octokit';

const GITHUB_TOKEN = (import.meta as any).env.VITE_GITHUB_TOKEN || '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';
const CENTRAL_DB_NAME = 'NoboClass-Central-Database';

const octokit = new Octokit({ auth: GITHUB_TOKEN });

let cachedUsername: string | null = null;
let useLocalStorageFallback = false;

async function getUsername() {
  if (cachedUsername) return cachedUsername;
  if (useLocalStorageFallback) return 'local';
  try {
    const { data } = await octokit.rest.users.getAuthenticated();
    cachedUsername = data.login;
    return data.login;
  } catch (e) {
    console.warn('Authentication error on GitHub, falling back to LocalStorage.', e);
    useLocalStorageFallback = true;
    return 'local';
  }
}

async function ensureCentralRepo() {
  const owner = await getUsername();
  if (useLocalStorageFallback) return { owner: 'local', repo: 'local' };
  
  try {
    await octokit.rest.repos.get({ owner, repo: CENTRAL_DB_NAME });
  } catch (e) {
    console.log('Creating central database repository...');
    await octokit.rest.repos.createForAuthenticatedUser({
      name: CENTRAL_DB_NAME,
      description: 'Central Database for Nobo Class App - Do not delete',
      private: true,
      auto_init: true
    });
  }
  return { owner, repo: CENTRAL_DB_NAME };
}

export async function saveUserData(email: string, data: any) {
  try {
    const { owner, repo } = await ensureCentralRepo();
    
    if (useLocalStorageFallback) {
       localStorage.setItem(`noboclass_user_${email}`, JSON.stringify(data));
       return { success: true };
    }

    const path = `database/users/${email.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    let sha;

    try {
      const { data: fileData } = await octokit.rest.repos.getContent({ owner, repo, path });
      if (!Array.isArray(fileData)) sha = fileData.sha;
    } catch (e) {}

    await octokit.rest.repos.createOrUpdateFileContents({
      owner, repo, path,
      message: `User update: ${email}`,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
      sha
    });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function publishCourse(courseData: any) {
  const owner = await getUsername();
  const isUpdate = !!courseData.repoName;
  const repoName = courseData.repoName || `nobo-course-${courseData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;

  try {
    if (useLocalStorageFallback) {
       const existingJson = localStorage.getItem('noboclass_courses') || '[]';
       let courses = JSON.parse(existingJson);
       
       if (isUpdate) {
         courses = courses.map((c: any) => c.id === courseData.id ? { ...c, ...courseData, updatedAt: new Date().toISOString() } : c);
       } else {
         courses.push({ ...courseData, id: repoName, repoName, createdAt: new Date().toISOString() });
       }
       
       localStorage.setItem('noboclass_courses', JSON.stringify(courses));
       return { success: true, repoName };
    }

    if (!isUpdate) {
      await octokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        description: `Nobo Class Course: ${courseData.title}`,
        auto_init: true
      });
    }

    let metaSha;
    try {
      const { data: fileData } = await octokit.rest.repos.getContent({ owner, repo: repoName, path: 'course-meta.json' });
      if (!Array.isArray(fileData)) metaSha = fileData.sha;
    } catch (e) {}

    await octokit.rest.repos.createOrUpdateFileContents({
      owner, repo: repoName, path: 'course-meta.json',
      message: isUpdate ? 'Update course metadata' : 'Initial course metadata',
      content: btoa(unescape(encodeURIComponent(JSON.stringify(courseData, null, 2)))),
      sha: metaSha
    });

    const { repo: centralRepo } = await ensureCentralRepo();
    const listPath = 'database/courses.json';
    let courses = [];
    let listSha;

    try {
      const { data: fileData } = await octokit.rest.repos.getContent({ owner, repo: centralRepo, path: listPath });
      if (!Array.isArray(fileData) && 'content' in fileData) {
        listSha = fileData.sha;
        courses = JSON.parse(decodeURIComponent(escape(atob(fileData.content || ''))));
      }
    } catch (e) {}

    if (isUpdate) {
      courses = courses.map((c: any) => (c.repoName === repoName || c.id === courseData.id) ? { ...c, ...courseData, updatedAt: new Date().toISOString() } : c);
    } else {
      courses.push({ ...courseData, id: repoName, repoName, createdAt: new Date().toISOString() });
    }

    await octokit.rest.repos.createOrUpdateFileContents({
      owner, repo: centralRepo, path: listPath,
      message: `Update course list: ${courseData.title}`,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(courses, null, 2)))),
      sha: listSha
    });

    return { success: true, repoName };
  } catch (error: any) {
    console.error('Publishing Error:', error);
    return { success: false, error: error.message };
  }
}

export async function submitInstructorApplication(appData: any) {
  try {
    const { owner, repo } = await ensureCentralRepo();
    if (useLocalStorageFallback) {
      const apps = JSON.parse(localStorage.getItem('instructor_applications') || '[]');
      apps.push(appData);
      localStorage.setItem('instructor_applications', JSON.stringify(apps));
      return { success: true };
    }

    const path = `database/applications/${appData.id}.json`;
    await octokit.rest.repos.createOrUpdateFileContents({
      owner, repo, path,
      message: `New instructor application: ${appData.userName}`,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(appData, null, 2))))
    });

    const listPath = 'database/applications_list.json';
    let apps = [];
    let listSha;

    try {
      const { data: fileData } = await octokit.rest.repos.getContent({ owner, repo, path: listPath });
      if (!Array.isArray(fileData) && 'content' in fileData) {
        listSha = fileData.sha;
        apps = JSON.parse(decodeURIComponent(escape(atob(fileData.content || ''))));
      }
    } catch (e) {}

    apps.push(appData);
    await octokit.rest.repos.createOrUpdateFileContents({
      owner, repo, path: listPath,
      message: 'Update applications list',
      content: btoa(unescape(encodeURIComponent(JSON.stringify(apps, null, 2)))),
      sha: listSha
    });

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function fetchInstructorApplications() {
  try {
    const { owner, repo } = await ensureCentralRepo();
    if (useLocalStorageFallback) {
      return JSON.parse(localStorage.getItem('instructor_applications') || '[]');
    }

    const path = 'database/applications_list.json';
    const { data: fileData } = await octokit.rest.repos.getContent({ owner, repo, path });
    if (!Array.isArray(fileData) && 'content' in fileData) {
      return JSON.parse(decodeURIComponent(escape(atob(fileData.content || ''))));
    }
  } catch (e) {}
  return [];
}

export async function updateApplicationStatus(appId: string, status: string) {
  try {
    const { owner, repo } = await ensureCentralRepo();
    if (useLocalStorageFallback) {
      let apps = JSON.parse(localStorage.getItem('instructor_applications') || '[]');
      apps = apps.map((a: any) => a.id === appId ? { ...a, status } : a);
      localStorage.setItem('instructor_applications', JSON.stringify(apps));
      return { success: true };
    }

    const listPath = 'database/applications_list.json';
    let apps = [];
    let listSha;

    const { data: fileData } = await octokit.rest.repos.getContent({ owner, repo, path: listPath });
    if (!Array.isArray(fileData) && 'content' in fileData) {
      listSha = fileData.sha;
      apps = JSON.parse(decodeURIComponent(escape(atob(fileData.content || ''))));
    }

    apps = apps.map((a: any) => a.id === appId ? { ...a, status } : a);

    await octokit.rest.repos.createOrUpdateFileContents({
      owner, repo, path: listPath,
      message: `Update application status: ${appId} to ${status}`,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(apps, null, 2)))),
      sha: listSha
    });

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function fetchAllCourses() {
  try {
    const { owner, repo } = await ensureCentralRepo();
    if (useLocalStorageFallback) {
       return JSON.parse(localStorage.getItem('noboclass_courses') || '[]');
    }

    const { data: fileData } = await octokit.rest.repos.getContent({ owner, repo, path: 'database/courses.json' });
    if (!Array.isArray(fileData) && 'content' in fileData) {
      return JSON.parse(decodeURIComponent(escape(atob(fileData.content || ''))));
    }
  } catch (e) {}
  return [];
}

export async function getUserData(email: string) {
  try {
    const { owner, repo } = await ensureCentralRepo();
    if (useLocalStorageFallback) {
       const userStr = localStorage.getItem(`noboclass_user_${email}`);
       return userStr ? JSON.parse(userStr) : null;
    }

    const path = `database/users/${email.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    const { data: fileData } = await octokit.rest.repos.getContent({ owner, repo, path });
    if (!Array.isArray(fileData) && 'content' in fileData) {
      return JSON.parse(decodeURIComponent(escape(atob(fileData.content || ''))));
    }
  } catch (e) {}
  return null;
}

export async function fetchUserList() {
  try {
    const { owner, repo } = await ensureCentralRepo();
    if (useLocalStorageFallback) {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('noboclass_user_'));
      return keys.map(k => JSON.parse(localStorage.getItem(k) || '{}'));
    }

    const { data: files } = await octokit.rest.repos.getContent({ owner, repo, path: 'database/users' });
    if (Array.isArray(files)) {
      const userPromises = files.map(async (file) => {
        if (file.type === 'file' && file.name.endsWith('.json')) {
          const { data: fileData } = await octokit.rest.repos.getContent({ owner, repo, path: file.path });
          if (!Array.isArray(fileData) && 'content' in fileData) {
            return JSON.parse(decodeURIComponent(escape(atob(fileData.content || ''))));
          }
        }
        return null;
      });
      const users = await Promise.all(userPromises);
      return users.filter(u => u !== null);
    }
  } catch (e) {}
  return [];
}

export async function saveRoutine(courseId: string, routineData: any[]) {
  try {
    const { owner, repo } = await ensureCentralRepo();
    if (useLocalStorageFallback) {
      localStorage.setItem(`noboclass_routine_${courseId}`, JSON.stringify(routineData));
      return { success: true };
    }

    const path = `database/routines/${courseId}.json`;
    let sha;
    try {
      const { data: fileData } = await octokit.rest.repos.getContent({ owner, repo, path });
      if (!Array.isArray(fileData)) sha = fileData.sha;
    } catch (e) {}

    await octokit.rest.repos.createOrUpdateFileContents({
      owner, repo, path,
      message: `Update routine for course: ${courseId}`,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(routineData, null, 2)))),
      sha
    });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function fetchRoutine(courseId: string) {
  try {
    const { owner, repo } = await ensureCentralRepo();
    if (useLocalStorageFallback) {
      const routineStr = localStorage.getItem(`noboclass_routine_${courseId}`);
      return routineStr ? JSON.parse(routineStr) : [];
    }

    const path = `database/routines/${courseId}.json`;
    const { data: fileData } = await octokit.rest.repos.getContent({ owner, repo, path });
    if (!Array.isArray(fileData) && 'content' in fileData) {
      return JSON.parse(decodeURIComponent(escape(atob(fileData.content || ''))));
    }
  } catch (e) {}
  return [];
}

export async function fetchAllRoutines() {
  try {
    const { owner, repo } = await ensureCentralRepo();
    if (useLocalStorageFallback) {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('noboclass_routine_'));
      let all: any[] = [];
      keys.forEach(k => all = [...all, ...JSON.parse(localStorage.getItem(k) || '[]')]);
      return all;
    }

    const { data: files } = await octokit.rest.repos.getContent({ owner, repo, path: 'database/routines' });
    if (Array.isArray(files)) {
      const promises = files.map(async (file) => {
        if (file.type === 'file' && file.name.endsWith('.json')) {
          const { data: fileData } = await octokit.rest.repos.getContent({ owner, repo, path: file.path });
          if (!Array.isArray(fileData) && 'content' in fileData) {
            return JSON.parse(decodeURIComponent(escape(atob(fileData.content || ''))));
          }
        }
        return null;
      });
      const results = await Promise.all(promises);
      return results.flat().filter(r => r !== null);
    }
  } catch (e) {}
  return [];
}

export async function updateUserField(email: string, field: string, value: any) {
  const userData = await getUserData(email);
  if (userData) {
    userData[field] = value;
    return saveUserData(email, userData);
  }
  return { success: false, error: 'User not found' };
}
