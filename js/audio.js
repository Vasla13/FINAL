window.registreAudio = (() => {
    const soundMap = {
        boot: 'assets/audio/boot_hdd_loop.wav',
        regisNext: 'assets/audio/regis_next.wav',
        uiOpen: 'assets/audio/ui_open.wav',
        uiOpenClean: 'assets/audio/ui_open_clean.wav',
        uiOpenRegis: 'assets/audio/ui_open_regis.wav',
        uiSelect: 'assets/audio/ui_select.wav',
        authSuccess: 'assets/audio/auth_success.wav',
        authError: 'assets/audio/auth_error.wav',
        emilyIdle: 'assets/audio/emily_idle_modem.wav'
    };

    const pendingPlayback = [];
    let primed = false;

    function play(name, options = {}) {
        const src = soundMap[name];
        if (!src) return null;

        const audio = new Audio(src);
        audio._registreCancelled = false;
        audio.preload = 'auto';
        audio.loop = options.loop === true;
        audio.volume = typeof options.volume === 'number' ? options.volume : 1;
        audio.playbackRate = typeof options.playbackRate === 'number' ? options.playbackRate : 1;
        if (typeof options.currentTime === 'number') {
            audio.currentTime = options.currentTime;
        }

        const startPlayback = () => {
            if (audio._registreCancelled) return;
            const playback = audio.play();
            if (playback && typeof playback.catch === 'function') {
                playback.catch(() => {
                    if (!primed && !audio._registreCancelled) {
                        pendingPlayback.push(startPlayback);
                    }
                });
            }
        };

        startPlayback();
        return audio;
    }

    function stop(audio, fadeMs = 0) {
        if (!audio) return;
        audio._registreCancelled = true;

        if (!fadeMs) {
            audio.pause();
            audio.currentTime = 0;
            return;
        }

        const startVolume = audio.volume;
        const steps = 10;
        let currentStep = 0;
        const interval = window.setInterval(() => {
            currentStep++;
            audio.volume = Math.max(0, startVolume * (1 - (currentStep / steps)));
            if (currentStep >= steps) {
                window.clearInterval(interval);
                audio.pause();
                audio.currentTime = 0;
                audio.volume = startVolume;
            }
        }, Math.max(20, Math.floor(fadeMs / steps)));
    }

    function primeAudio() {
        if (primed) return;
        primed = true;

        while (pendingPlayback.length) {
            const retry = pendingPlayback.shift();
            retry();
        }
    }

    window.addEventListener('pointerdown', primeAudio, { passive: true });
    window.addEventListener('keydown', primeAudio, { passive: true });

    return {
        play,
        stop
    };
})();
