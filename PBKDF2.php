<?php

namespace Likipe\HMACBundle;

/**
 * Password-Based Key Derivation Function v2
 */
class PBKDF2
{
	/**
	 * PBKDF2 Implementation (described in RFC 2898)
	 *
	 *  @param  string  Password
	 *  @param  string  Salt
	 *  @param  int     Iteration count
	 *  @param  int     Number of machine words to generate (word = 32 bits)
	 *  @param  string  A hash() algorithm
	 *
	 *  @return string  The derived key
	 */
	public static function deriveKey($password, $salt, $count, $key_length, $algorithm = 'sha256' ) { 
		$hash_len = strlen(hash($algorithm, null, true)); /* Hash length */
		$blocks   = ceil($key_length * 4 / $hash_len);    /*  4 = 32 bits / (sizeof char) */
		$derived  = '';                                   /* Derived key */
		
		for($i = 1; $i <= $blocks; $i++ ) {
			/* Initial hash for this block */
			$last_block = hash_hmac($algorithm, $salt . pack('N', $i), $password, true);
			$iterated   = $last_block; 
			
			/* Block iterations */
			for($j = 1; $j < $count; $j++) {
				$last_block = hash_hmac($algorithm, $last_block, $password, true);
				$iterated  ^= $last_block;
			}
		
			$derived .= $iterated; /* Append iterated block */
		}
		
		return $derived;
	}
}