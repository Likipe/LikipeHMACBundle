<?php

namespace Likipe\HMACBundle\NonceValidator;

use Memcached as MemcachedObject;

use Likipe\HMACBundle\NonceValidatorInterface;

/**
 * This nonce-validator utilizes memcached as a short-time value storage to prevent replay attacks,
 * the first part of the nonce is the number of milliseconds since the last epoch as the nonces
 * are supposed to be client-generated for this nonce-validator.
 * 
 * NOTE:
 *     This validator does NOT check if the nonce was issued by this server, NOR the age of
 *     the key for the macId.
 * 
 * TODO: Make a variant of this validator which checks the age of the mac-key used (macId)
 *       and then a controller + service which generates these keys.
 */
class MemcachedNonceValidator extends AbstractNonceValidator
{
	protected $memcached = null;
	protected $keyPrefix = '';
	protected $maxAge    = 10000; /* 10 seconds */
	
	/**
	 * @param  int  max age in milliseconds
	 */
	public function __construct(MemcachedObject $memcached, $keyPrefix, $maxAge = 10000  /* 10 seconds */)
	{
		$this->memcached = $memcached;
		$this->maxAge    = $maxAge;
		$this->expires   = 2 * max(ceil($maxAge / 1000), 1);
	}
	
	public function nonceIsValid($macId, $timestamp, $random)
	{
		if((floor(microtime(true) * 1000) - $timestamp) > $this->maxAge) {
			return false;
		}
		
		$key = $this->keyPrefix.'__'.base64_encode($macId.'__'.$random);
		
		if($this->memcached->get($key)) {
			return false;
		}
		
		$this->memcached->set($key, true, $this->expires);
		
		return true;
	}
}
