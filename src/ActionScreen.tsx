import { Home, Search, Bell, Mail, Bookmark, Heart, MessageCircle, Repeat2, Share } from 'lucide-react';

interface ActionScreenProps {
  onToastClick: () => void;
}

export function ActionScreen({ onToastClick }: ActionScreenProps) {
  return (
    <div className="w-[393px] h-[852px] bg-black rounded-3xl overflow-hidden flex flex-col border border-zinc-800 relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="w-8 h-8"></div>
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <div className="w-8 h-8"></div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-800">
        <div className="flex-1 py-4 text-center text-white relative">
          For You
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-full"></div>
        </div>
        <div className="flex-1 py-4 text-center text-zinc-500">
          Following
        </div>
      </div>

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Tweet */}
        <div className="border-b border-zinc-800 p-4">
          <div className="flex gap-3">
            <img 
              src="https://images.unsplash.com/photo-1752859951149-7d3fc700a7ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB0ZWNoJTIwZGV2ZWxvcGVyJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY2OTkxMzA3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="TechGuru"
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white">TechGuru</span>
                <span className="text-zinc-500">@TechGuru</span>
                <span className="text-zinc-500">·</span>
                <span className="text-zinc-500">2h</span>
              </div>
              <div className="text-white mt-2">
                Just upgraded to Python 3.14! 🐍 The new features are incredible. Type hints are now even more powerful and the performance improvements are noticeable. If you're still on 3.12, it's time to upgrade!
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-4 max-w-md">
                <button className="flex items-center gap-2 text-zinc-500 hover:text-blue-500 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">24</span>
                </button>
                <button className="flex items-center gap-2 text-zinc-500 hover:text-green-500 transition-colors">
                  <Repeat2 className="w-5 h-5" />
                  <span className="text-sm">89</span>
                </button>
                <button className="flex items-center gap-2 text-zinc-500 hover:text-pink-500 transition-colors">
                  <Heart className="w-5 h-5" />
                  <span className="text-sm">234</span>
                </button>
                <button className="flex items-center gap-2 text-blue-500">
                  <Bookmark className="w-5 h-5 fill-blue-500" />
                </button>
                <button className="flex items-center gap-2 text-zinc-500 hover:text-blue-500 transition-colors">
                  <Share className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional tweets (placeholders) */}
        <div className="border-b border-zinc-800 p-4">
          <div className="flex gap-3">
            <img 
              src="https://images.unsplash.com/photo-1763568469368-05f8760ffc23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXRvbW90aXZlJTIwZW50aHVzaWFzdCUyMHBvcnRyYWl0fGVufDF8fHx8MTc2NzAxODk4OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="AutoInsider"
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white">AutoInsider</span>
                <span className="text-zinc-500">@AutoInsider</span>
                <span className="text-zinc-500">·</span>
                <span className="text-zinc-500">4h</span>
              </div>
              <div className="text-white mt-2">
                The active aero on the new 911 GT3 RS is absolute witchcraft. 🏎️💨 Look at that rear wing. Physics is just a suggestion to Porsche engineers.
              </div>
              
              {/* Porsche Image */}
              <div className="mt-3 rounded-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1559533670-2195d0363733?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxQb3JzY2hlJTIwOTExJTIwR1QzJTIwUlMlMjByYWNlJTIwdHJhY2t8ZW58MXx8fHwxNjc2NzAxODk4OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Porsche 911 GT3 RS"
                  className="w-full h-64 object-cover"
                />
              </div>
              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-4 max-w-md">
                <button className="flex items-center gap-2 text-zinc-500 hover:text-blue-500 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">156</span>
                </button>
                <button className="flex items-center gap-2 text-zinc-500 hover:text-green-500 transition-colors">
                  <Repeat2 className="w-5 h-5" />
                  <span className="text-sm">42</span>
                </button>
                <button className="flex items-center gap-2 text-zinc-500 hover:text-pink-500 transition-colors">
                  <Heart className="w-5 h-5" />
                  <span className="text-sm">892</span>
                </button>
                <button className="flex items-center gap-2 text-zinc-500 hover:text-blue-500 transition-colors">
                  <Bookmark className="w-5 h-5" />
                </button>
                <button className="flex items-center gap-2 text-zinc-500 hover:text-blue-500 transition-colors">
                  <Share className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-zinc-800 p-4">
          <div className="flex gap-3">
            <img 
              src="https://images.unsplash.com/photo-1760037028485-d00dd2b8f6f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBicm9hZGNhc3RlciUyMHBvcnRyYWl0fGVufDF8fHx8MTc2NzAxODUxMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="SportsCenter"
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white">SportsCenter</span>
                <span className="text-zinc-500">@SportsCenter</span>
                <span className="text-zinc-500">·</span>
                <span className="text-zinc-500">7h</span>
              </div>
              <div className="text-white mt-2">
                What a game last night! 🏀
              </div>
              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-4 max-w-md">
                <button className="flex items-center gap-2 text-zinc-500 hover:text-blue-500 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">328</span>
                </button>
                <button className="flex items-center gap-2 text-zinc-500 hover:text-green-500 transition-colors">
                  <Repeat2 className="w-5 h-5" />
                  <span className="text-sm">1.2k</span>
                </button>
                <button className="flex items-center gap-2 text-zinc-500 hover:text-pink-500 transition-colors">
                  <Heart className="w-5 h-5" />
                  <span className="text-sm">3.4k</span>
                </button>
                <button className="flex items-center gap-2 text-zinc-500 hover:text-blue-500 transition-colors">
                  <Bookmark className="w-5 h-5" />
                </button>
                <button className="flex items-center gap-2 text-zinc-500 hover:text-blue-500 transition-colors">
                  <Share className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-zinc-800 p-4">
          <div className="flex gap-3">
            <img 
              src="https://images.unsplash.com/photo-1565687981296-535f09db714e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZlbG9wZXIlMjBjb2RpbmclMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjcwMTg1MTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="CodeNews"
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white">CodeNews</span>
                <span className="text-zinc-500">@CodeNews</span>
                <span className="text-zinc-500">·</span>
                <span className="text-zinc-500">6h</span>
              </div>
              <div className="text-white mt-2">
                Deno 2.0 is officially out! 🦕
              </div>
              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-4 max-w-md">
                <button className="flex items-center gap-2 text-zinc-500 hover:text-blue-500 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">78</span>
                </button>
                <button className="flex items-center gap-2 text-zinc-500 hover:text-green-500 transition-colors">
                  <Repeat2 className="w-5 h-5" />
                  <span className="text-sm">312</span>
                </button>
                <button className="flex items-center gap-2 text-zinc-500 hover:text-pink-500 transition-colors">
                  <Heart className="w-5 h-5" />
                  <span className="text-sm">456</span>
                </button>
                <button className="flex items-center gap-2 text-zinc-500 hover:text-blue-500 transition-colors">
                  <Bookmark className="w-5 h-5" />
                </button>
                <button className="flex items-center gap-2 text-zinc-500 hover:text-blue-500 transition-colors">
                  <Share className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification - Absolutely Positioned Overlay */}
      <div 
        onClick={onToastClick}
        className="absolute top-[280px] left-1/2 -translate-x-1/2 w-fit px-5 py-2 rounded-full shadow-lg cursor-pointer hover:opacity-90 transition-opacity z-10"
        style={{ backgroundColor: '#1D9BF0' }}
      >
        <span className="text-white whitespace-nowrap text-sm">✨ Saved to Dev Resources</span>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-around py-3 border-t border-zinc-800 bg-black">
        <Home className="w-6 h-6 text-white" />
        <Search className="w-6 h-6 text-zinc-500" />
        <Bell className="w-6 h-6 text-zinc-500" />
        <Mail className="w-6 h-6 text-zinc-500" />
      </div>
    </div>
  );
}