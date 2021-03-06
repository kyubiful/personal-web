export const Title = ({ text }) => {
  return (
      <div className="flex items-center mt-5 mb-5 md:mt-auto lg:mt-auto">
        <h1 className="text-lg md:text-3xl lg:text-3xl min-w-max">{text}</h1>
        <div className="ml-2 h-0.5 max-w-xs w-full bg-slate-200"/>
      </div>
  )
}
