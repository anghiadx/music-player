// TASK
// 1. Xây dựng giao diện -> OK
// 2. Render song -> OK
// 2.1 Xử lý cuộn -> OK
// 3. xử lý play / pause -> OK
// 4. Xử lý next / prev -> OK
// 5. Xử lý thanh tiến độ -> OK
// 6. Xử lý lặp / random song -> OK
// 7. Focus song đang phát -> OK
// 7.1 Click songElement play song -> OK
// 8. Hoàn thiện -> OK
// 9. Bonus: 
//      - save config to local stogare -> OK
//      - Random list -> OK
// 


const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

class MusicPlayer{

    config(){
        // API config
        this.songAPI = 'https://api.nghiane.cf/music-player/view/';
        
        // config not save to local storage
        this.firstAccess = true;
        this.isPlay = false;
        this.isUseProgressPseudo = true;

        // List config save to local storage
        this.isRepeat = false;
        this.isRandom = false;
        this.isRandomList = true;

        // Save Config To Local Storage
        this.configKey = 'Nghiadx_MusicPlayer_Key';
        this.getConfig = JSON.parse(localStorage.getItem(this.configKey)) || {};
        this.setConfig = function(key, value){
            this.getConfig[key] = value;
            return localStorage.setItem(this.configKey, JSON.stringify(this.getConfig));
        }
    }
    
    start(){
        // Get config
        this.config();

        // Get element
        this.get();

        // Set thuoc tinh va su kien cho element
        this.set();

        // Update default config
        this.updateConfig();

        // load and handle song
        this.handleSongs();

    }

    get(){

        this.musicPlayer = $('#music-player');
        this.songInfo = $('#song-info');
        this.songList = $('#song-list');
        this.documentElement = document.documentElement;
        this.body = document.body;
        this.songCd = $('#song-cd');
        this.songName = $('#song-name');
        this.songProgress = $('.song-progress input[name="song-progress"]');
        this.currentTimeProgress = $('.song-progress #current-time');
        this.totalTimeProgress = $('.song-progress #total-time');
        this.playBtn = $('#play-btn');
        this.playWaiting = $('#play-btn #waiting');
        this.nextBtn = $('#next-btn');
        this.prevBtn = $('#prev-btn');
        this.repeatBtn = $('#repeat-btn');
        this.randomBtn = $('#random-btn');
        this.noSongIcon = $('#no-song .icon-load');
        this.noSongTitle = $('#no-song .title-load');
        
        if(this.isUseProgressPseudo){
            this.songProgressDot = $('#progress-dot');
            this.songProgressBar = $('#progress-bar');
        }
        
    }
    set(){
        // Set animation Cd
        this.cdAnimation = this.songCd.animate([
            {
                transform: 'rotate(0)'
            },
            {
                transform: 'rotate(360deg)'
            }
        ],{
            duration: 10000,
            iterations: 'Infinity'
        });
        this.cdAnimation.pause();

        // Use Progress Pseudo
        if(this.isUseProgressPseudo){
            this.songProgress.style.opacity = 0;
            this.songProgressBar.style.display = 'block';
        }

        // Set other default values
        this.audio = new Audio();
        this.SONG_LIST = null;
        this.songs = null;
        this.songMores = null;
        this.totalTime = null;
        this.currenIndex = 0;
            
    }

    updateConfig(){
        this.isRepeat = this.getConfig.isRepeat;
        this.isRandom = this.getConfig.isRandom;

        // Update trang thai Random / Repeat
        if(this.isRepeat){
            this.repeatBtn.classList.add('active');
            this.audio.loop = true;
        }
            
        if(this.isRandom)
            this.randomBtn.classList.add('active');
    }

    //  ============== Function ===============

    async handleSongs(){

        // Update song list
        this.SONG_LIST = await this.loadSongs();

        // If the value of SONG_LIST is invalid, exit function
        if(!this.SONG_LIST)
            return false;
        else this.songInfo.classList.add('loaded');

        // Random list music (if isRandomList = true)
        if(this.isRandomList)
            this.randomList();

        // render song to view
        this.renderSong()

        // Update first song
        this.updateSong();

        // Handle Music Player
        this.handleMusicPlayer();

    }

    // Get data songs from API
    async loadSongs(){
        let songData = null;
        try{
            const response = await fetch(this.songAPI);
            songData = await response.json();
        }
        catch(e){
            // Show notify load error end return
            this.loadError();
            return false;
        }

        return songData.data
    }

    // Notify when song load is error
    loadError(){
        this.noSongIcon.innerHTML = '<img alt="error" src="https://cdn-icons-png.flaticon.com/512/6935/6935358.png" />';
        this.noSongTitle.innerText = 'Tải bài hát thất bại!';
    }

    // Random music list
    randomList(){
        this.SONG_LIST.sort(()=>{
            return Math.random() - 0.5;
        })
    }

    // Render song
    renderSong(){
        let html = this.SONG_LIST.map((song)=>{
            return `<div class="song">
                        <div class="song-cd cd" style="background-image: url('${song.imageURL}')"></div>
                        <div class="song-info">
                            <div class="name song-name">${song.name}</div>
                            <div class="singer">${song.singer}</div>
                        </div>
                        <div class="song-more">
                            <i class="fas fa-ellipsis-h"></i>
                            <span class="song-wave">
                                <span class="wave"></span>
                                <span class="wave"></span>
                                <span class="wave"></span>
                            </span>
                        </div>
                    </div>`;
        });
        this.songList.innerHTML = html.join('');
    }

    updateSong(){
        // Update url
        this.audio.src = this.SONG_LIST[this.currenIndex].path;
        // Update Cd image
        this.songCd.style.backgroundImage = `url('${this.SONG_LIST[this.currenIndex].imageURL}')`;
        // Update name
        this.songName.innerText = this.SONG_LIST[this.currenIndex].name;
        // Update Progress
        this.songProgress.value = 0;
        // Active current song
        if($('.song.active'))
            $('.song.active').classList.remove('active');
        this.updateSongElement(); // Update songs
        this.songs[this.currenIndex].classList.add('active');
        
        // Update Progress
        this.updateProgress(this);

        // Update view song for user
        if(!this.firstAccess){
            this.songs[this.currenIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }

        // Update isPlay / Neu dang play thi pause
        if(this.isPlay)
            this.playBtn.click();
        
    }
    updateSongElement(){
        // Update list song
        this.songs = $$('.song');

        // Update song more element
        this.songMores = $$('.song .song-more');
    }
    
    updateProgress(_this){
        // Set progess ve mac dinh
        this.songProgress.value = 0;
        if(this.isUseProgressPseudo)
            this.songProgressDot.style.width = '0%';
        // Thuc thi khi audio da load duoc du lieu
        this.audio.onloadeddata = function(){
            // lay tong thoi gian cua song
            _this.totalTime = Math.floor(this.duration);
            // Update total-time element
            _this.totalTimeProgress.innerText = _this.convertTime(_this.totalTime);
            // goi ham xu ly progress
            _this.continueUpdateProgress();
        }    
    }

    // Stop update progress khi tua thoi gian
    stopUpdateProgress(){
        this.audio.ontimeupdate = null;
    }
    
    // Tiep tuc progress update khi tua xong
    continueUpdateProgress(percentCurrent=0){
        if(percentCurrent)
            this.audio.currentTime = percentCurrent * this.totalTime / 100; // Tu % tinh ra so giay hien tai
        
        // Update progress
        this.audio.ontimeupdate = ()=>{
            // lay thoi gian audio hien tai
            let currentTime = this.audio.currentTime;
            // Tinh so phan tram hien tai
            let percentCurrent = currentTime / this.totalTime * 100;
            
            // Lay gia tri hien tai cua progress
            let valueProgress = this.songProgress.value;

            // Cap nhat thanh progress khi % thay doi
            this.songProgress.value = percentCurrent;
            //Update progressDot theo progress
            if(this.isUseProgressPseudo)
                this.songProgressDot.style.width = percentCurrent +'%';
                
            
            // Cap nhat thoi gian phat hien tai
            this.currentTimeProgress.innerText = this.convertTime(Math.floor(currentTime));
            
        }
    }
    // Convert seconds - > time string == (60 -> 01:00)
    convertTime(seconds=0){
        let min = parseInt(seconds/60);
        seconds%=60;
        let front = (min<10) ? `0${min}` : min;
        let back = (seconds<10) ? `0${seconds}` : seconds;

        return `${front}:${back}`;
    }

    // HANDLE PLAY MUSIC
    handleMusicPlayer(){
        // isAccess
        this.firstAccess = false;

        // Handle scroll
        this.handleScroll();

        // Handle Play / Pause
        this.handlePlay();

        // Handle Next
        this.handleNext();

        // Handle Next
        this.handlePrev();

        // Handle repeat
        this.handleRepeat();

        // Handle random
        this.handleBtnRandom();

        // Handle song ended
        this.handleEnded();

        // XU ly khi song bi tam dung do load du lieu
        this.handleEndedByLoadData()

        // Handle click play song
        this.handleClickSong();

        // Handle click song more
        this.handleClickSongMore();

        // Handle event Progress
        this.handleEventProgress();
    }

    handleScroll(){
        document.onscroll = ()=>{
            let currenScroll = window.scrollY || this.documentElement.scrollTop;
            currenScroll = currenScroll>190 ? 0 : 190-currenScroll;
            this.songCd.style.width = `${currenScroll}px`;
            this.songCd.style.height = `${currenScroll}px`;
        }
    }

    handlePlay(){
        this.playBtn.onclick = ()=>{
            if(!this.isPlay){
                // change icon play -> pause
                this.playBtn.querySelector('i').className = 'fas fa-pause';
                // play song khi du lieu du de phat
                this.audio.play();
                // Run Cd
                this.cdAnimation.play();

                // Waiting on
                this.playWaiting.style.opacity = 1;

                // Wave play 
                $('.song.active').querySelector('.song-wave').classList.add('active');

                // Update trang thai isPlay
                this.isPlay = !this.isPlay;
            }else{
                // change icon pause -> play
                this.playBtn.querySelector('i').className = 'fas fa-play';
                // pause song
                this.audio.pause();
                // Pause Cd
                this.cdAnimation.pause();

                // Waiting off
                this.playWaiting.style.opacity = 0;

                // Wave pause 
                $('.song.active').querySelector('.song-wave').classList.remove('active');

                // Update trang thai isPlay
                this.isPlay = !this.isPlay;
            }
            
        }
    }

    // Next btn
    handleNext(){
        this.nextBtn.onclick = ()=>{
            if(this.isRandom)
                this.handleRandom();
            else{
                this.currenIndex++;
                if(this.currenIndex >= this.SONG_LIST.length)
                    this.currenIndex = 0;
            }
                
            // Update new song
            this.updateSong();
            // Play song
            this.playBtn.click();
        }  
    }

    // Prev btn
    handlePrev(){
        this.prevBtn.onclick = ()=>{
            if(this.isRandom)
                this.handleRandom();
            else{
                this.currenIndex--;
                if(this.currenIndex < 0)
                    this.currenIndex = this.SONG_LIST.length-1;
            }
            
            // Update new song
            this.updateSong();
            // Play song
            this.playBtn.click();
        }  
    }

    // Repeat btn
    handleRepeat(){
        this.repeatBtn.onclick = ()=>{
            if(!this.isRepeat){
                this.repeatBtn.classList.add('active');
                this.audio.loop = true;
            }else{
                this.repeatBtn.classList.remove('active');
                this.audio.loop = false;
            }
            
            // update trang thai isRepeat
            this.isRepeat = !this.isRepeat;
            this.setConfig('isRepeat',this.isRepeat); // update to local storage
        }
            
    }

    // Random btn
    handleBtnRandom(){
        this.randomBtn.onclick = ()=>{
            if(!this.isRandom){
                this.randomBtn.classList.add('active');
            }else{
                this.randomBtn.classList.remove('active');
            }

            // Update trang thai random
            this.isRandom = !this.isRandom;
            this.setConfig('isRandom',this.isRandom); // update to local storage
        }
    }
    handleRandom(){
        let indexRandom;
        do{
            indexRandom = Math.floor(Math.random() * this.SONG_LIST.length);
        }while(indexRandom==this.currenIndex)
        this.currenIndex = indexRandom;
    }

    // Song ended
    handleEnded(){
        this.audio.onended = ()=>{
            this.nextBtn.click();
        }
    }

    // XU ly khi song bi tam dung do nguoi dung kich hoat ngoai giao dien
    handleEndedByLoadData(){
        let _this = this;
        this.audio.onwaiting = ()=>{
            waitStatus('0.8s','initial');
            
            // console.log('waiting')
        }
        this.audio.onplaying = ()=>{
            waitStatus('1.4s','linear');
            // console.log('ok')
        }

        // function
        function waitStatus(duration, timemingFunction){
            _this.playWaiting.style.animationDuration = duration;
            _this.playWaiting.style.animationTimingFunction = timemingFunction;
        }
    }


    // Handle click play song
    handleClickSong(){
        this.songs.forEach((song,index)=>{
            song.onclick = ()=>{
                if(index == this.currenIndex)
                    return;

                this.currenIndex = index;
                this.updateSong();
                this.playBtn.click();
            }
        });
    }

    // Handle click song more
    handleClickSongMore(){
        this.songMores.forEach((more,index)=>{
            more.onclick = (e)=>{
                // Ngan chan hanh vi noi bot
                e.stopPropagation();
            }
        });
    }

    // Handle Evenet Progress
    handleEventProgress(){
        let _this = this;
        let widthProgress = this.songProgress.offsetWidth;

        // Set event khi tua thanh progress
        this.songProgress.onmousedown = (e)=>{
            this.stopUpdateProgress(); 
            this.songProgress.onmousemove = mouseMoveProgress // Set onmousemove

            // Update ProgressDot (Progress gia)
            if(this.isUseProgressPseudo){
                let positionClick = e.offsetX;
                let valuePercent = positionClick / widthProgress * 100;
                this.songProgressDot.style.width = `${valuePercent}%`;
                // console.log(widthProgress)
            }
                
        }
        this.songProgress.onmouseup = ()=>{
            this.continueUpdateProgress(this.songProgress.value);
            this.songProgress.onmousemove = null;
        }

        // Mobile
        this.songProgress.ontouchstart = (e)=>{
            this.stopUpdateProgress();
            this.songProgress.ontouchmove = mouseMoveProgress;
        }
        this.songProgress.ontouchend = ()=>{
            this.continueUpdateProgress(this.songProgress.value);
            this.songProgress.ontouchmove = null;
        }



        function mouseMoveProgress(){
            let valueProgress = this.value;
            let secondsCurrent = Math.floor(valueProgress * _this.totalTime / 100);
            _this.currentTimeProgress.innerText = _this.convertTime(secondsCurrent); //Cap nhat time string khi keo thanh progress
            
            if(_this.isUseProgressPseudo)
                _this.songProgressDot.style.width = `${_this.songProgress.value}%`;
            

            // console.log(_this.songProgressDot.offsetWidth);

        }
    }

}
// Create and start app
const player = new MusicPlayer();
player.start();

