'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getBudget() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return 1000000;

        const { data, error } = await supabase
            .from('user_settings')
            .select('monthly_budget')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle(); 

        if (error) {
            console.error('Error fetching budget:', error);
            return 1000000;
        }

        return data?.monthly_budget || 1000000;
    } catch (error) {
        console.error('Unexpected error fetching budget:', error);
        return 1000000;
    }
}

export async function updateBudget(newBudget: number) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return { success: false, error: 'Usuario no autenticado' };

        // Check if row exists
        const { data: existingData } = await supabase
            .from('user_settings')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();
        
        let error;
        if (existingData) {
            const res = await supabase
                .from('user_settings')
                .update({ monthly_budget: newBudget })
                .eq('id', existingData.id);
            error = res.error;
        } else {
            const res = await supabase
                .from('user_settings')
                .insert([{ monthly_budget: newBudget, user_id: user.id }]);
            error = res.error;
        }

        if (error) {
            console.error('Error updating budget:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Unexpected error updating budget:', error);
        return { success: false, error: 'Unexpected error' };
    }
}
