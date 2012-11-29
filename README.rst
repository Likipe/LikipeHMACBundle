===========
Likipe HMAC
===========

Using Assetic to load the javascript files
==========================================

::

  assetic:
    assets:
      likipehmac_js:
        inputs:
          - @LikipeHMACBundle/Resources/public/js/CryptoJS/core.js
          - @LikipeHMACBundle/Resources/public/js/CryptoJS/x64-core.js
          - @LikipeHMACBundle/Resources/public/js/CryptoJS/enc-base64.js
          - @LikipeHMACBundle/Resources/public/js/CryptoJS/sha256.js
          - @LikipeHMACBundle/Resources/public/js/CryptoJS/hmac.js
          - @LikipeHMACBundle/Resources/public/js/LikipeHMAC.js
