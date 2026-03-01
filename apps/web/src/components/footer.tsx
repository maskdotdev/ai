import { ContainerInner, ContainerOuter } from '@/components/container'

export function Footer() {
  return (
    <footer className="mt-32 flex-none">
      <ContainerOuter>
        <div className="pt-10 pb-16">
          <div className="gradient-line mb-10" />
          <ContainerInner>
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm font-light text-neutral-500"></div>
              <p className="text-xs tracking-widest text-neutral-600 uppercase">
                &copy; {new Date().getFullYear()} Kiyotaka
              </p>
            </div>
          </ContainerInner>
        </div>
      </ContainerOuter>
    </footer>
  )
}
