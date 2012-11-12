<?php

namespace Likipe\HMACBundle;

interface NonceValidatorInterface
{
	/**
	 * Returns true if the supplied nonce and hmac id is a valid nonce (ie. proper format and the nonce has not been used recently).
	 * 
	 * The nonce should also include a timestamp, this should not be too old.
	 * 
	 * @return string
	 */
	public function isValid($macId, $nonce);
}
