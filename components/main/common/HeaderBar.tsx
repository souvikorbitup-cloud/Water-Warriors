export default function HeaderBar() {
  return (
    <div className="w-full bg-primary text-primary-foreground relative z-40">
      <div className="my-container-x flex items-center justify-center py-2.5 sm:py-3">
        <p className="text-center text-[8px] md:text-[10px] leading-4 font-normal text-primary-foreground xl:text-[13.5px] md:leading-5 xl:leading-6">
          All proprietary technology and processes featured on this site are
          protected under national and international patent pending status.
          Unauthorized reproduction or use is strictly prohibited.
        </p>
      </div>
    </div>
  );
}
