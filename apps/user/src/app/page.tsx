export default function Home() {
  return <main className="flex min-h-screen flex-col bg-[#f5f7ef] px-[7vw] py-[38px] text-base max-[600px]:py-[30px]">
    <header className="flex items-center justify-between">
      <strong className="text-[17px] font-bold tracking-[1px]">N<span className="text-[#91af46]">.</span> / NEXT PORTAL</strong>
      <span className="text-[10px] tracking-[2px] text-[#7c8e7e] max-[600px]:hidden">DATA, CONNECTED.</span>
    </header>
    <section className="flex-1 pt-[14vh] pb-[12vh]">
      <p className="text-[11px] tracking-[3px] text-[#718366]">OPEN POSSIBILITIES</p>
      <h1 className="my-[26px] text-[clamp(36px,5.5vw,76px)] leading-[1.35] font-bold tracking-[-3px]">데이터가 열어주는<br />새로운 가능성<span className="text-[#91af46]">.</span></h1>
      <p className="text-[15px] leading-[1.9] text-[#7b897b]">찾고, 연결하고, 발견하는 데이터 포털.<br />더 나은 데이터 경험을 준비하고 있습니다.</p>
      <span className="mt-[25px] inline-block rounded-[30px] border border-[#dce3d1] px-5 py-3 text-xs text-[#678055]">서비스 준비 중</span>
    </section>
    <footer className="flex items-center justify-between border-t border-[#dde4d5] pt-[30px] text-[10px] tracking-[2px] text-[#7c8e7e]">NEXT PORTAL <span className="tracking-normal">데이터로 연결되는 세상</span></footer>
  </main>;
}
