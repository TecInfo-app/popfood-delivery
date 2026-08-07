import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 'https://xxlbagladzeezdenfbrq.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bGJhZ2xhZHplZXpkZW5mYnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNzIwNDEsImV4cCI6MjEwMTY0ODA0MX0.6-RbagE7tpaVc8RFGfwPDxWg7CswhyuIXjRRf-g1OSc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const auth = {
    currentUser: null,
    onAuthStateChanged: (authObj, cb) => {
        if (typeof authObj === 'function') cb = authObj;
        supabase.auth.onAuthStateChange((event, session) => {
            const user = session?.user || null;
            auth.currentUser = user;
            cb(user);
        });
    },
    signInWithEmailAndPassword: async (authObj, email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    },
    createUserWithEmailAndPassword: async (authObj, email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        return data;
    },
    sendPasswordResetEmail: async (authObj, email) => {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        return data;
    },
    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }
};

export const onAuthStateChanged = auth.onAuthStateChanged;
export const signInWithEmailAndPassword = auth.signInWithEmailAndPassword;
export const createUserWithEmailAndPassword = auth.createUserWithEmailAndPassword;
export const sendPasswordResetEmail = auth.sendPasswordResetEmail;
export const signOut = auth.signOut;

export const db = {};
export const Timestamp = {
    now: () => new Date(),
    fromDate: (d) => d
};
export const serverTimestamp = () => new Date().toISOString();

export const COLLECTIONS = {
    restaurantProfile: 'restaurants',
    categories: 'categories',
    products: 'products',
    complements: 'complements',
    orders: 'orders',
    coupons: 'coupons',
    clients: 'clients'
};

export const collection = (db, path) => ({ type: 'collection', path });
export const doc = (db, path, id) => {
    if (id) return { type: 'doc', path, id };
    // sometimes doc(collectionRef, id) is used, or doc(db, path/id)
    if (typeof db === 'object' && db.type === 'collection') {
        return { type: 'doc', path: db.path, id: path };
    }
    return { type: 'doc', path, id: undefined };
};
export const query = (col, ...args) => ({ ...col, queryArgs: args });
export const where = (field, op, value) => ({ type: 'where', field, op, value });
export const orderBy = (field, dir = 'asc') => ({ type: 'orderBy', field, dir });
export const limit = (num) => ({ type: 'limit', num });

// Mocks for array operations
export const arrayUnion = (...args) => ({ type: 'arrayUnion', args });
export const arrayRemove = (...args) => ({ type: 'arrayRemove', args });

export const getDoc = async (docRef) => {
    const { data, error } = await supabase.from(docRef.path).select('*').eq('id', docRef.id).maybeSingle();
    return {
        exists: () => !!data,
        data: () => data || null,
        id: docRef.id
    };
};

export const getDocs = async (queryRef) => {
    let q = supabase.from(queryRef.path).select('*');
    if (queryRef.queryArgs) {
        queryRef.queryArgs.forEach(arg => {
            if (arg.type === 'where') {
                if (arg.op === '==') q = q.eq(arg.field, arg.value);
                if (arg.op === '>') q = q.gt(arg.field, arg.value);
                if (arg.op === '<') q = q.lt(arg.field, arg.value);
                if (arg.op === '>=') q = q.gte(arg.field, arg.value);
                if (arg.op === '<=') q = q.lte(arg.field, arg.value);
                if (arg.op === 'array-contains') q = q.contains(arg.field, [arg.value]);
            }
            if (arg.type === 'orderBy') {
                q = q.order(arg.field, { ascending: arg.dir === 'asc' });
            }
            if (arg.type === 'limit') {
                q = q.limit(arg.num);
            }
        });
    }
    const { data, error } = await q;
    return {
        empty: !data || data.length === 0,
        docs: (data || []).map(d => ({
            id: d.id,
            data: () => d,
            exists: () => true
        })),
        forEach: function(cb) { this.docs.forEach(cb) }
    };
};

export const setDoc = async (docRef, data, options = {}) => {
    const payload = { ...data, id: docRef.id };
    const { error } = await supabase.from(docRef.path).upsert(payload);
    if (error) throw error;
};

export const updateDoc = async (docRef, data) => {
    const { error } = await supabase.from(docRef.path).update(data).eq('id', docRef.id);
    if (error) throw error;
};

export const deleteDoc = async (docRef) => {
    const { error } = await supabase.from(docRef.path).delete().eq('id', docRef.id);
    if (error) throw error;
};

// Simple onSnapshot mapping to Supabase Realtime
export const onSnapshot = (ref, callback) => {
    if (ref.type === 'doc') {
        // Initial fetch
        getDoc(ref).then(callback);
        // Subscribe
        const channel = supabase.channel(`public:${ref.path}:${ref.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: ref.path, filter: `id=eq.${ref.id}` }, payload => {
                // Mock docSnap
                getDoc(ref).then(callback); // Refresh entirely for simplicity
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    } else {
        // Initial fetch
        getDocs(ref).then(callback);
        // Subscribe
        let filterStr = undefined;
        if (ref.queryArgs) {
            const eqArg = ref.queryArgs.find(a => a.type === 'where' && a.op === '==');
            if (eqArg) filterStr = `${eqArg.field}=eq.${eqArg.value}`;
        }
        
        const channel = supabase.channel(`public:${ref.path}-list`)
            .on('postgres_changes', { event: '*', schema: 'public', table: ref.path, filter: filterStr }, payload => {
                getDocs(ref).then(callback);
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    }
};

export const writeBatch = () => ({
    set: (docRef, data) => setDoc(docRef, data),
    update: (docRef, data) => updateDoc(docRef, data),
    delete: (docRef) => deleteDoc(docRef),
    commit: async () => {} // Auto-committed in this proxy since we didn't implement true batching
});

export const getMessaging = () => ({});
export const getToken = async () => 'mock-token';
export const onMessage = () => {};
export const messaging = {};
export const app = {};
export const VAPID_KEY = '';
