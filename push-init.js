
(function(d,z,s){
    s.src='https://'+d+'/act/files/tag.min.js?z='+z;
    s.onerror=function(){
        // Fallback pro případ blokování nebo chyby sítě
        console.warn('Ad-Tag load failed, retrying with cache-buster...');
        var retry = document.createElement('script');
        retry.src='https://'+d+'/act/files/tag.min.js?z='+z+'&r='+Math.random();
        document.head.appendChild(retry);
    };
    document.head.appendChild(s);
})('5gvci.com', 10503531, document.createElement('script'));
