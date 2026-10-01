export default function StarRating({ rating }) {
    return (<div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (<svg key={s} className="w-3.5 h-3.5" viewBox="0 0 20 20">
          {rating >= s ? (<polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7" fill="#C8952A"/>) : rating >= s - 0.5 ? (<>
              <defs>
                <linearGradient id={`h${s}`}>
                  <stop offset="50%" stopColor="#C8952A"/>
                  <stop offset="50%" stopColor="#D1C4A0"/>
                </linearGradient>
              </defs>
              <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7" fill={`url(#h${s})`}/>
            </>) : (<polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7" fill="#D1C4A0"/>)}
        </svg>))}
      <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
    </div>);
}
