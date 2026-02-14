import { getSettings } from '@/actions/settings'
import { SettingsForm } from '@/components/settings/settings-form'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const data = await getSettings()

    if (!data) {
        redirect('/login')
    }

    return (
        <main className="min-h-screen p-6 md:p-12 font-[family-name:var(--font-geist-sans)]">
            <header className="max-w-2xl mx-auto mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Configuración</h1>
                <p className="text-zinc-500">Administra tu cuenta y preferencias personales.</p>
            </header>

            <div className="max-w-4xl mx-auto">
                <SettingsForm settings={data.settings} profile={data.profile} />
            </div>
        </main>
    )
}
